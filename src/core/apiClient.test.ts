import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_API_CONFIG,
  buildRequestPayload,
  formatApiError,
  normalizeChatEndpoint,
  parseSseLine,
} from './apiClient';
import type { Bot } from '../types/liquid';

const dummyBot: Bot = {
  id: 'b1',
  name: 'Bot',
  description: '',
  avatar: '',
  systemPrompt: '',
  greeting: '',
  modelId: '',
  supportsVision: false,
  useCustomParams: false,
  temperature: 0.2,
  topP: 0.8,
  maxTokens: 512,
  createdAt: 1,
  updatedAt: 1,
};

test('normalizeChatEndpoint handles trailing slashes and explicit endpoints', () => {
  assert.equal(
    normalizeChatEndpoint('https://api.openai.com/v1/', '/chat/completions'),
    'https://api.openai.com/v1/chat/completions'
  );
  assert.equal(
    normalizeChatEndpoint('https://api.openai.com/v1/chat/completions', '/chat/completions'),
    'https://api.openai.com/v1/chat/completions'
  );
  assert.equal(
    normalizeChatEndpoint('http://localhost:11434/v1', 'https://custom.example/chat'),
    'https://custom.example/chat'
  );
});

test('buildRequestPayload respects bot overrides and omits unsupported frequency_penalty', () => {
  const { payload } = buildRequestPayload({
    apiConfig: { ...DEFAULT_API_CONFIG, supportsFrequencyPenalty: false },
    bot: { ...dummyBot, useCustomParams: true, modelId: 'custom-model', temperature: 0.3 },
    messages: [{ role: 'user', content: 'Hola' }],
    stream: true,
  });

  assert.equal(payload.model, 'custom-model');
  assert.equal(payload.temperature, 0.3);
  assert.equal('frequency_penalty' in payload, false);
});

test('parseSseLine parses delta chunks and [DONE] markers cleanly', () => {
  const chunk = parseSseLine('data: {"choices":[{"delta":{"content":"Hola"}}]}');
  assert.equal(chunk.deltaText, 'Hola');
  assert.equal(chunk.done, false);

  const done = parseSseLine('data: [DONE]');
  assert.equal(done.done, true);
});

test('formatApiError returns clear human messages for HTTP errors', () => {
  const authErr = formatApiError(401, '{"error":{"message":"Incorrect API key"}}');
  assert.ok(authErr.includes('401'));
  assert.ok(authErr.includes('Incorrect API key'));
});
