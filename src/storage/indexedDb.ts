import type { Bot, ChatMessage, Conversation, MemoryItem } from '../types/liquid';

const DB_NAME = 'liquid_ai_db';
const DB_VERSION = 1;

const STORES = {
  bots: 'bots',
  conversations: 'conversations',
  messages: 'messages',
  memories: 'memories',
} as const;

type StoreName = (typeof STORES)[keyof typeof STORES];

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB no está disponible en este entorno.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORES.bots)) {
        db.createObjectStore(STORES.bots, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORES.conversations)) {
        const convStore = db.createObjectStore(STORES.conversations, { keyPath: 'id' });
        convStore.createIndex('botId', 'botId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.messages)) {
        const msgStore = db.createObjectStore(STORES.messages, { keyPath: 'id' });
        msgStore.createIndex('conversationId', 'conversationId', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORES.memories)) {
        const memStore = db.createObjectStore(STORES.memories, { keyPath: 'id' });
        memStore.createIndex('conversationId', 'conversationId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('Error abriendo IndexedDB.'));
  });
}

async function getAllFromStore<T>(storeName: StoreName): Promise<T[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const req = store.getAll();
    req.onsuccess = () => resolve((req.result as T[]) ?? []);
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}

async function putRecord<T>(storeName: StoreName, item: T): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).put(item);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

async function deleteRecord(storeName: StoreName, id: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    tx.objectStore(storeName).delete(id);
    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export async function loadAllWorkspaceData(): Promise<{
  bots: Bot[];
  conversations: Conversation[];
  messages: ChatMessage[];
  memories: MemoryItem[];
}> {
  const [bots, conversations, messages, memories] = await Promise.all([
    getAllFromStore<Bot>(STORES.bots),
    getAllFromStore<Conversation>(STORES.conversations),
    getAllFromStore<ChatMessage>(STORES.messages),
    getAllFromStore<MemoryItem>(STORES.memories),
  ]);
  return { bots, conversations, messages, memories };
}

export async function replaceAllWorkspaceData(data: {
  bots: Bot[];
  conversations: Conversation[];
  messages: ChatMessage[];
  memories: MemoryItem[];
}): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(
      [STORES.bots, STORES.conversations, STORES.messages, STORES.memories],
      'readwrite'
    );
    const bStore = tx.objectStore(STORES.bots);
    const cStore = tx.objectStore(STORES.conversations);
    const mStore = tx.objectStore(STORES.messages);
    const memStore = tx.objectStore(STORES.memories);

    bStore.clear();
    cStore.clear();
    mStore.clear();
    memStore.clear();

    for (const b of data.bots) bStore.put(b);
    for (const c of data.conversations) cStore.put(c);
    for (const m of data.messages) mStore.put(m);
    for (const mem of data.memories) memStore.put(mem);

    tx.oncomplete = () => {
      db.close();
      resolve();
    };
    tx.onerror = () => {
      db.close();
      reject(tx.error);
    };
  });
}

export const idbStorage = {
  putBot: (bot: Bot) => putRecord(STORES.bots, bot),
  deleteBot: (id: string) => deleteRecord(STORES.bots, id),
  putConversation: (conv: Conversation) => putRecord(STORES.conversations, conv),
  deleteConversation: (id: string) => deleteRecord(STORES.conversations, id),
  putMessage: (msg: ChatMessage) => putRecord(STORES.messages, msg),
  deleteMessage: (id: string) => deleteRecord(STORES.messages, id),
  putMemory: (mem: MemoryItem) => putRecord(STORES.memories, mem),
  deleteMemory: (id: string) => deleteRecord(STORES.memories, id),
};
