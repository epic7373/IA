import type {
  ApiConfig,
  Bot,
  ChatMessage,
  Conversation,
  MemoryItem,
} from '../types/liquid';

const RECENT_MESSAGE_WINDOW = 14;
const SUMMARIZE_THRESHOLD = 18;

export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / 3.8);
}

/**
 * Extracts potential factual memories ONLY from a single conversation's user messages.
 * Never touches other conversations or bots.
 */
export function extractMemoryCandidates(
  conversationId: string,
  messages: ChatMessage[],
  existingMemories: MemoryItem[]
): MemoryItem[] {
  const existingSet = new Set(
    existingMemories
      .filter((m) => m.conversationId === conversationId)
      .map((m) => m.content.trim().toLowerCase())
  );

  const patterns = [
    /(?:me llamo|soy|mi nombre es)\s+([^.,;\n]{2,60})/i,
    /(?:prefiero|me gusta mucho|siempre uso|trabajo como|estudio)\s+([^.,;\n]{4,90})/i,
    /(?:mi proyecto|estoy construyendo|objetivo principal es|necesito que recuerdes)\s+([^.,;\n]{4,110})/i,
    /(?:my name is|i am a|i work as|i prefer|remember that)\s+([^.,;\n]{3,90})/i,
  ];

  const additions: MemoryItem[] = [];
  const convMsgs = messages.filter(
    (m) => m.conversationId === conversationId && m.role === 'user'
  );

  for (const msg of convMsgs) {
    for (const pattern of patterns) {
      const match = msg.content.match(pattern);
      if (match && match[0]) {
        const cleaned = match[0].trim();
        const key = cleaned.toLowerCase();
        if (cleaned.length >= 8 && !existingSet.has(key)) {
          existingSet.add(key);
          additions.push({
            id: `mem_${msg.id}_${additions.length}`,
            conversationId,
            content: cleaned,
            importance: 'normal',
            source: 'auto',
            createdAt: msg.createdAt,
          });
        }
      }
    }
  }
  return additions;
}

/**
 * Builds a deterministic progressive summary from older messages of ONE conversation
 * so long chats stay within context budgets without sending every historical turn raw.
 */
export function buildProgressiveSummary(
  previousSummary: string,
  messagesToCompress: ChatMessage[]
): string {
  if (messagesToCompress.length === 0) return previousSummary;

  const lines: string[] = [];
  if (previousSummary.trim()) {
    lines.push(previousSummary.trim());
  }

  for (const m of messagesToCompress) {
    if (m.role === 'system') continue;
    const label = m.role === 'user' ? 'Usuario' : 'Asistente';
    const compact = m.content.replace(/\s+/g, ' ').trim();
    if (!compact) continue;
    const snippet = compact.length > 160 ? `${compact.slice(0, 157)}...` : compact;
    lines.push(`- ${label}: ${snippet}`);
  }

  const joined = lines.join('\n');
  // Keep progressive summary bounded to ~1800 characters
  if (joined.length <= 1800) return joined;
  return joined.slice(joined.length - 1800).replace(/^[^\n]*\n/, '');
}

export function shouldUpdateSummary(
  conversation: Conversation,
  conversationMessages: ChatMessage[]
): { needed: boolean; messagesToSummarize: ChatMessage[]; newestCoveredId: string | null } {
  const validMsgs = conversationMessages.filter(
    (m) => m.conversationId === conversation.id && m.role !== 'system'
  );
  if (validMsgs.length <= SUMMARIZE_THRESHOLD) {
    return { needed: false, messagesToSummarize: [], newestCoveredId: null };
  }

  const cutoffIndex = validMsgs.length - RECENT_MESSAGE_WINDOW;
  const olderSlice = validMsgs.slice(0, cutoffIndex);
  if (olderSlice.length === 0) {
    return { needed: false, messagesToSummarize: [], newestCoveredId: null };
  }

  const lastCoveredIdx = conversation.summaryUpToMessageId
    ? olderSlice.findIndex((m) => m.id === conversation.summaryUpToMessageId)
    : -1;

  const unsummarizedOlder =
    lastCoveredIdx >= 0 ? olderSlice.slice(lastCoveredIdx + 1) : olderSlice;

  if (unsummarizedOlder.length < 4) {
    return { needed: false, messagesToSummarize: [], newestCoveredId: null };
  }

  return {
    needed: true,
    messagesToSummarize: unsummarizedOlder,
    newestCoveredId: unsummarizedOlder[unsummarizedOlder.length - 1].id,
  };
}

export type OpenAiContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface OpenAiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | OpenAiContentPart[];
}

export interface AssembledContext {
  apiMessages: OpenAiMessage[];
  systemBlock: string;
  memoryBlock: string;
  includedMessageCount: number;
  summarizedCount: number;
  estimatedTokens: number;
  visionAttachmentsIncluded: number;
  visionAttachmentsSkipped: number;
}

/**
 * Strictly isolates context assembly to the provided conversationId.
 * Filters both messages and memories by conversationId to guarantee zero cross-chat bleed.
 */
export function assembleApiContext(params: {
  bot: Bot;
  apiConfig: ApiConfig;
  conversation: Conversation;
  allMessages: ChatMessage[];
  allMemories: MemoryItem[];
  supportsVision: boolean;
}): AssembledContext {
  const { bot, apiConfig, conversation, allMessages, allMemories, supportsVision } = params;

  // Strict per-conversation isolation filter
  const convMessages = allMessages
    .filter((m) => m.conversationId === conversation.id && m.role !== 'system')
    .sort((a, b) => a.createdAt - b.createdAt);

  const convMemories = allMemories
    .filter((m) => m.conversationId === conversation.id)
    .sort((a, b) => {
      if (a.importance !== b.importance) return a.importance === 'high' ? -1 : 1;
      return b.createdAt - a.createdAt;
    });

  const pinnedMessages = convMessages.filter((m) => m.pinned);

  const systemParts: string[] = [];
  if (apiConfig.globalSystemPrompt.trim()) {
    systemParts.push(apiConfig.globalSystemPrompt.trim());
  }
  if (bot.systemPrompt.trim()) {
    systemParts.push(
      `Identidad del asistente (${bot.name}):\n${bot.systemPrompt.trim()}`
    );
  }

  let memoryBlock = '';
  if (conversation.memoryEnabled) {
    const memSections: string[] = [];
    if (conversation.summary.trim()) {
      memSections.push(`Resumen contextual previo:\n${conversation.summary.trim()}`);
    }
    if (convMemories.length > 0) {
      const memLines = convMemories
        .slice(0, 20)
        .map((m) => `- [${m.importance === 'high' ? 'Alta' : 'Normal'}] ${m.content}`);
      memSections.push(`Recuerdos específicos de esta conversación:\n${memLines.join('\n')}`);
    }
    if (pinnedMessages.length > 0) {
      const pinLines = pinnedMessages
        .slice(0, 8)
        .map(
          (m) =>
            `- (${m.role === 'user' ? 'Usuario' : bot.name}): ${m.content.slice(0, 260)}`
        );
      memSections.push(`Mensajes fijados de esta conversación:\n${pinLines.join('\n')}`);
    }
    if (memSections.length > 0) {
      memoryBlock = memSections.join('\n\n');
      systemParts.push(
        `Memoria aislada de la conversación actual (ID: ${conversation.id}):\n${memoryBlock}`
      );
    }
  }

  const systemBlock = systemParts.join('\n\n');
  const apiMessages: OpenAiMessage[] = [];
  if (systemBlock) {
    apiMessages.push({ role: 'system', content: systemBlock });
  }

  const recentSlice =
    convMessages.length > RECENT_MESSAGE_WINDOW && conversation.memoryEnabled && conversation.summary
      ? convMessages.slice(convMessages.length - RECENT_MESSAGE_WINDOW)
      : convMessages;

  let visionIncluded = 0;
  let visionSkipped = 0;

  for (const msg of recentSlice) {
    const attachments = msg.attachments ?? [];
    const imageAttachments = attachments.filter((a) => a.kind === 'image');
    const textAttachments = attachments.filter((a) => a.kind === 'text' && a.textContent);

    let textBody = msg.content;
    if (textAttachments.length > 0) {
      const docsText = textAttachments
        .map((doc) => `\n\n[Archivo adjunto: ${doc.name}]\n\`\`\`\n${doc.textContent}\n\`\`\``)
        .join('');
      textBody = `${textBody}${docsText}`.trim();
    }

    if (imageAttachments.length > 0 && msg.role === 'user') {
      if (supportsVision) {
        const parts: OpenAiContentPart[] = [
          { type: 'text', text: textBody || 'Analiza las imágenes adjuntas.' },
          ...imageAttachments.map((img) => ({
            type: 'image_url' as const,
            image_url: { url: img.dataUrl },
          })),
        ];
        apiMessages.push({ role: 'user', content: parts });
        visionIncluded += imageAttachments.length;
      } else {
        visionSkipped += imageAttachments.length;
        apiMessages.push({
          role: 'user',
          content: textBody || '[El usuario adjuntó imágenes, pero el modelo actual no admite entrada visual]',
        });
      }
    } else {
      apiMessages.push({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: textBody,
      });
    }
  }

  let totalTokens = estimateTokens(systemBlock);
  for (const m of apiMessages) {
    if (typeof m.content === 'string') {
      totalTokens += estimateTokens(m.content);
    } else {
      for (const p of m.content) {
        totalTokens += p.type === 'text' ? estimateTokens(p.text) : 256;
      }
    }
  }

  return {
    apiMessages,
    systemBlock,
    memoryBlock,
    includedMessageCount: recentSlice.length,
    summarizedCount: convMessages.length - recentSlice.length,
    estimatedTokens: totalTokens,
    visionAttachmentsIncluded: visionIncluded,
    visionAttachmentsSkipped: visionSkipped,
  };
}
