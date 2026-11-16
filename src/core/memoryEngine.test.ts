import test from 'node:test';
import assert from 'node:assert/strict';
import {
  assembleApiContext,
  buildProgressiveSummary,
  extractMemoryCandidates,
} from './memoryEngine';
import { DEFAULT_API_CONFIG } from './apiClient';
import type { Bot, ChatMessage, Conversation, MemoryItem } from '../types/liquid';

const botA: Bot = {
  id: 'bot-a',
  name: 'Bot A',
  description: 'Test Bot A',
  avatar: '',
  systemPrompt: 'Eres Bot A.',
  greeting: 'Hola',
  modelId: 'gpt-4o-mini',
  supportsVision: true,
  useCustomParams: false,
  temperature: 0.7,
  topP: 0.9,
  maxTokens: 1000,
  createdAt: 1,
  updatedAt: 1,
};

const conv1: Conversation = {
  id: 'conv-1',
  botId: 'bot-a',
  title: 'Chat 1',
  archived: false,
  memoryEnabled: true,
  summary: 'Resumen exclusivo del chat 1.',
  summaryUpToMessageId: null,
  createdAt: 1,
  updatedAt: 1,
};

const conv2: Conversation = {
  id: 'conv-2',
  botId: 'bot-a',
  title: 'Chat 2',
  archived: false,
  memoryEnabled: true,
  summary: '',
  summaryUpToMessageId: null,
  createdAt: 2,
  updatedAt: 2,
};

test('strict isolation prevents memory and messages from leaking between conversations of the same bot', () => {
  const messages: ChatMessage[] = [
    { id: 'm1', conversationId: 'conv-1', role: 'user', content: 'Secreto uno', createdAt: 10 },
    { id: 'm2', conversationId: 'conv-2', role: 'user', content: 'Pregunta dos', createdAt: 20 },
  ];
  const memories: MemoryItem[] = [
    { id: 'mem1', conversationId: 'conv-1', content: 'Clave secreta alpha', importance: 'high', source: 'manual', createdAt: 11 },
    { id: 'mem2', conversationId: 'conv-2', content: 'Contexto beta', importance: 'normal', source: 'manual', createdAt: 21 },
  ];

  const ctx1 = assembleApiContext({
    bot: botA,
    apiConfig: DEFAULT_API_CONFIG,
    conversation: conv1,
    allMessages: messages,
    allMemories: memories,
    supportsVision: true,
  });

  const ctx2 = assembleApiContext({
    bot: botA,
    apiConfig: DEFAULT_API_CONFIG,
    conversation: conv2,
    allMessages: messages,
    allMemories: memories,
    supportsVision: true,
  });

  assert.ok(ctx1.systemBlock.includes('Clave secreta alpha'));
  assert.ok(!ctx1.systemBlock.includes('Contexto beta'));
  assert.ok(ctx2.systemBlock.includes('Contexto beta'));
  assert.ok(!ctx2.systemBlock.includes('Clave secreta alpha'));
  assert.ok(!ctx2.systemBlock.includes('Resumen exclusivo del chat 1'));
  assert.equal(ctx2.includedMessageCount, 1);
  assert.equal(ctx2.apiMessages[1].content, 'Pregunta dos');
});

test('memory toggle off excludes conversation summary, pinned messages, and memories while keeping bot system prompt', () => {
  const convDisabled: Conversation = { ...conv1, memoryEnabled: false };
  const memories: MemoryItem[] = [
    { id: 'mem1', conversationId: 'conv-1', content: 'Dato privado', importance: 'high', source: 'manual', createdAt: 11 },
  ];
  const ctx = assembleApiContext({
    bot: botA,
    apiConfig: DEFAULT_API_CONFIG,
    conversation: convDisabled,
    allMessages: [{ id: 'm1', conversationId: 'conv-1', role: 'user', content: 'Hola', createdAt: 10 }],
    allMemories: memories,
    supportsVision: true,
  });

  assert.ok(ctx.systemBlock.includes('Eres Bot A.'));
  assert.ok(!ctx.systemBlock.includes('Dato privado'));
  assert.equal(ctx.memoryBlock, '');
});

test('vision attachments are stripped cleanly when model does not support vision', () => {
  const msgs: ChatMessage[] = [
    {
      id: 'm1',
      conversationId: 'conv-2',
      role: 'user',
      content: 'Describe esto',
      createdAt: 10,
      attachments: [
        {
          id: 'att1',
          name: 'foto.png',
          mimeType: 'image/png',
          size: 1024,
          dataUrl: 'data:image/png;base64,AAA',
          kind: 'image',
        },
      ],
    },
  ];

  const withVision = assembleApiContext({
    bot: botA,
    apiConfig: DEFAULT_API_CONFIG,
    conversation: conv2,
    allMessages: msgs,
    allMemories: [],
    supportsVision: true,
  });
  assert.equal(withVision.visionAttachmentsIncluded, 1);
  assert.ok(Array.isArray(withVision.apiMessages[1].content));

  const withoutVision = assembleApiContext({
    bot: botA,
    apiConfig: DEFAULT_API_CONFIG,
    conversation: conv2,
    allMessages: msgs,
    allMemories: [],
    supportsVision: false,
  });
  assert.equal(withoutVision.visionAttachmentsIncluded, 0);
  assert.equal(withoutVision.visionAttachmentsSkipped, 1);
  assert.equal(typeof withoutVision.apiMessages[1].content, 'string');
});

test('extractMemoryCandidates and buildProgressiveSummary stay scoped', () => {
  const msgs: ChatMessage[] = [
    { id: '1', conversationId: 'conv-1', role: 'user', content: 'Me llamo Carlos y trabajo como diseñador.', createdAt: 1 },
    { id: '2', conversationId: 'conv-2', role: 'user', content: 'Me llamo Elena.', createdAt: 2 },
  ];
  const mems1 = extractMemoryCandidates('conv-1', msgs, []);
  assert.ok(mems1.length >= 1);
  assert.ok(mems1.every((m) => m.conversationId === 'conv-1'));
  assert.ok(!mems1.some((m) => m.content.includes('Elena')));

  const summary = buildProgressiveSummary('', msgs.slice(0, 1));
  assert.ok(summary.includes('Carlos'));
});
