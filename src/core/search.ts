import type { Bot, ChatMessage, Conversation, ExportBundle } from '../types/liquid';

export function searchConversations(
  conversations: Conversation[],
  messages: ChatMessage[],
  bots: Bot[],
  query: string,
  includeArchived: boolean
): Conversation[] {
  const q = query.trim().toLowerCase();
  const botMap = new Map(bots.map((b) => [b.id, b]));
  const msgMap = new Map<string, ChatMessage[]>();

  for (const m of messages) {
    const arr = msgMap.get(m.conversationId);
    if (arr) arr.push(m);
    else msgMap.set(m.conversationId, [m]);
  }

  return conversations
    .filter((c) => (includeArchived ? c.archived : !c.archived))
    .filter((c) => {
      if (!q) return true;
      if (c.title.toLowerCase().includes(q)) return true;
      if (c.summary.toLowerCase().includes(q)) return true;
      const bot = botMap.get(c.botId);
      if (bot && bot.name.toLowerCase().includes(q)) return true;
      const convMsgs = msgMap.get(c.id) ?? [];
      return convMsgs.some((m) => m.content.toLowerCase().includes(q));
    })
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function validateExportBundle(raw: unknown): ExportBundle {
  if (!raw || typeof raw !== 'object') {
    throw new Error('El archivo JSON no contiene un objeto válido.');
  }
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.bots) || !Array.isArray(obj.conversations) || !Array.isArray(obj.messages)) {
    throw new Error('El respaldo JSON no tiene la estructura esperada de LIQUID AI (bots, conversations, messages).');
  }
  return {
    version: 1,
    exportedAt: typeof obj.exportedAt === 'number' ? obj.exportedAt : Date.now(),
    glassConfig: obj.glassConfig as ExportBundle['glassConfig'],
    generalSettings: obj.generalSettings as ExportBundle['generalSettings'],
    bots: obj.bots as ExportBundle['bots'],
    conversations: obj.conversations as ExportBundle['conversations'],
    messages: obj.messages as ExportBundle['messages'],
    memories: Array.isArray(obj.memories) ? (obj.memories as ExportBundle['memories']) : [],
  };
}
