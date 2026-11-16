import test from 'node:test';
import assert from 'node:assert/strict';
import { searchConversations, validateExportBundle } from './search';
import { createSeedData } from './seedData';

test('searchConversations matches both title and message content while respecting archive filter', () => {
  const seed = createSeedData();
  const byContent = searchConversations(
    seed.conversations,
    seed.messages,
    seed.bots,
    'refractionIndex',
    false
  );
  assert.equal(byContent.length, 1);
  assert.equal(byContent[0].id, 'conv_welcome_1');

  const byBotName = searchConversations(
    seed.conversations,
    seed.messages,
    seed.bots,
    'Soren',
    false
  );
  assert.equal(byBotName.length, 1);
  assert.equal(byBotName[0].id, 'conv_editorial_2');
});

test('validateExportBundle accepts valid export and rejects malformed payloads', () => {
  const seed = createSeedData();
  const bundle = validateExportBundle({
    version: 1,
    exportedAt: Date.now(),
    bots: seed.bots,
    conversations: seed.conversations,
    messages: seed.messages,
    memories: seed.memories,
  });
  assert.equal(bundle.bots.length, seed.bots.length);
  assert.throws(() => validateExportBundle({ invalid: true }));
});
