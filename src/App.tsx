import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { sendChatCompletion } from './core/apiClient';
import {
  assembleApiContext,
  buildProgressiveSummary,
  extractMemoryCandidates,
  shouldUpdateSummary,
} from './core/memoryEngine';
import { searchConversations, validateExportBundle } from './core/search';
import { createSeedData } from './core/seedData';
import { AmbientLiquidCanvas } from './glass/AmbientLiquidCanvas';
import { GlassFilterDefs } from './glass/GlassFilterDefs';
import { computeGlassValues, sanitizeGlassConfig } from './glass/glassEngine';
import { idbStorage, loadAllWorkspaceData, replaceAllWorkspaceData } from './storage/indexedDb';
import {
  loadActiveIds,
  loadApiConfig,
  loadGeneralSettings,
  loadGlassConfig,
  saveActiveIds,
  saveApiConfig,
  saveGeneralSettings,
  saveGlassConfig,
} from './storage/localPrefs';
import type {
  ApiConfig,
  Bot,
  ChatAttachment,
  ChatMessage,
  Conversation,
  ExportBundle,
  FontFamilyOption,
  GeneralSettings,
  GlassConfig,
  MemoryItem,
} from './types/liquid';
import { BotsManagerModal } from './components/BotsManagerModal';
import { ChatViewport } from './components/ChatViewport';
import { Composer } from './components/Composer';
import { GlassEngineModal } from './components/GlassEngineModal';
import { MemoryDrawer } from './components/MemoryDrawer';
import { SettingsModal } from './components/SettingsModal';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';

const FONT_STACKS: Record<FontFamilyOption, string> = {
  'plus-jakarta': '"Plus Jakarta Sans", system-ui, -apple-system, sans-serif',
  'dm-sans': '"DM Sans", system-ui, -apple-system, sans-serif',
  manrope: '"Manrope", system-ui, -apple-system, sans-serif',
  system: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
};

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
}

export default function App() {
  // Persisted Local Preferences
  const [apiConfig, setApiConfig] = useState<ApiConfig>(() => loadApiConfig());
  const [glassConfig, setGlassConfig] = useState<GlassConfig>(() => loadGlassConfig());
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>(() =>
    loadGeneralSettings()
  );

  // IndexedDB Persistent Workspace State
  const [loaded, setLoaded] = useState(false);
  const [bots, setBots] = useState<Bot[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [memories, setMemories] = useState<MemoryItem[]>([]);

  const [activeBotId, setActiveBotId] = useState<string>('');
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // UI Navigation & Modal States
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [memoryDrawerOpen, setMemoryDrawerOpen] = useState(false);
  const [glassEngineOpen, setGlassEngineOpen] = useState(false);
  const [botsModalOpen, setBotsModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Search & Archive Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);

  // Composer & Streaming State
  const [composerInput, setComposerInput] = useState('');
  const [composerAttachments, setComposerAttachments] = useState<ChatAttachment[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Transient Toast
  const [toast, setToast] = useState<string | null>(null);
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((curr) => (curr === msg ? null : curr));
    }, 3200);
  }, []);

  // Load workspace from IndexedDB (with deterministic seed on first visit)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stored = await loadAllWorkspaceData();
        if (!mounted) return;

        if (stored.bots.length === 0) {
          const seed = createSeedData();
          await replaceAllWorkspaceData(seed);
          if (!mounted) return;
          setBots(seed.bots);
          setConversations(seed.conversations);
          setMessages(seed.messages);
          setMemories(seed.memories);
          setActiveBotId(seed.bots[0].id);
          setActiveConversationId(seed.conversations[0].id);
        } else {
          setBots(stored.bots);
          setConversations(stored.conversations);
          setMessages(stored.messages);
          setMemories(stored.memories);

          const savedIds = loadActiveIds();
          const validConv = stored.conversations.find(
            (c) => c.id === savedIds.conversationId
          );
          const fallbackConv = stored.conversations[0] ?? null;
          const chosenConv = validConv ?? fallbackConv;
          setActiveConversationId(chosenConv?.id ?? null);

          const validBot =
            stored.bots.find((b) => b.id === (chosenConv?.botId ?? savedIds.botId)) ??
            stored.bots[0];
          setActiveBotId(validBot?.id ?? '');
        }
      } catch {
        const seed = createSeedData();
        if (!mounted) return;
        setBots(seed.bots);
        setConversations(seed.conversations);
        setMessages(seed.messages);
        setMemories(seed.memories);
        setActiveBotId(seed.bots[0].id);
        setActiveConversationId(seed.conversations[0].id);
      } finally {
        if (mounted) setLoaded(true);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Auto-save LocalStorage preferences
  useEffect(() => {
    saveApiConfig(apiConfig);
  }, [apiConfig]);

  useEffect(() => {
    saveGlassConfig(glassConfig);
  }, [glassConfig]);

  useEffect(() => {
    saveGeneralSettings(generalSettings);
  }, [generalSettings]);

  useEffect(() => {
    if (loaded) {
      saveActiveIds(activeConversationId, activeBotId || null);
    }
  }, [loaded, activeConversationId, activeBotId]);

  // Detect reduced motion / low-power hardware
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const listener = (ev: MediaQueryListEvent) => setPrefersReducedMotion(ev.matches);
    mq.addEventListener('change', listener);
    return () => mq.removeEventListener('change', listener);
  }, []);

  const reducedEffects = useMemo(() => {
    if (generalSettings.performanceMode === 'reduced') return true;
    if (generalSettings.performanceMode === 'high') return false;
    const lowCores =
      typeof navigator !== 'undefined' &&
      typeof navigator.hardwareConcurrency === 'number' &&
      navigator.hardwareConcurrency <= 2;
    return prefersReducedMotion || lowCores;
  }, [generalSettings.performanceMode, prefersReducedMotion]);

  const computedGlass = useMemo(
    () => computeGlassValues(glassConfig, reducedEffects),
    [glassConfig, reducedEffects]
  );

  // Sync theme, reduced-effects, and CSS variables to <html>
  useEffect(() => {
    const root = document.documentElement;
    if (generalSettings.theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (reducedEffects) {
      root.classList.add('reduced-effects');
    } else {
      root.classList.remove('reduced-effects');
    }

    for (const [k, v] of Object.entries(computedGlass.cssVars)) {
      root.style.setProperty(k, v);
    }
    root.style.setProperty('--lg-accent', generalSettings.accentColor);
    root.style.setProperty(
      '--lg-font-family',
      FONT_STACKS[generalSettings.fontFamily]
    );
    root.style.setProperty('--lg-font-size', `${generalSettings.fontSize}px`);
  }, [generalSettings, computedGlass, reducedEffects]);

  // Derived active entities
  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId]
  );

  const activeBot = useMemo(() => {
    const targetBotId = activeConversation?.botId ?? activeBotId;
    return bots.find((b) => b.id === targetBotId) ?? bots[0] ?? null;
  }, [bots, activeConversation, activeBotId]);

  const activeMessages = useMemo(() => {
    if (!activeConversation) return [];
    return messages
      .filter((m) => m.conversationId === activeConversation.id)
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [messages, activeConversation]);

  const activeMemories = useMemo(() => {
    if (!activeConversation) return [];
    return memories
      .filter((m) => m.conversationId === activeConversation.id)
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [memories, activeConversation]);

  const pinnedMessages = useMemo(
    () => activeMessages.filter((m) => m.pinned),
    [activeMessages]
  );

  const filteredConversations = useMemo(
    () =>
      searchConversations(
        conversations,
        messages,
        bots,
        searchQuery,
        showArchived
      ),
    [conversations, messages, bots, searchQuery, showArchived]
  );

  const supportsVision = Boolean(
    apiConfig.supportsVision && (activeBot?.supportsVision ?? true)
  );

  const contextPreview = useMemo(() => {
    if (!activeBot || !activeConversation) {
      return {
        apiMessages: [],
        systemBlock: '',
        memoryBlock: '',
        includedMessageCount: 0,
        summarizedCount: 0,
        estimatedTokens: 0,
        visionAttachmentsIncluded: 0,
        visionAttachmentsSkipped: 0,
      };
    }
    return assembleApiContext({
      bot: activeBot,
      apiConfig,
      conversation: activeConversation,
      allMessages: messages,
      allMemories: memories,
      supportsVision,
    });
  }, [activeBot, activeConversation, apiConfig, messages, memories, supportsVision]);

  // Conversation CRUD
  const handleNewChat = useCallback(
    (botIdOverride?: string) => {
      const targetBotId = botIdOverride || activeBotId || bots[0]?.id;
      if (!targetBotId) return;
      const bot = bots.find((b) => b.id === targetBotId) ?? bots[0];
      const now = Date.now();
      const newConv: Conversation = {
        id: `conv_${now}_${Math.random().toString(36).slice(2, 6)}`,
        botId: bot.id,
        title: `Nuevo chat · ${bot.name.split('·')[0].trim()}`,
        archived: false,
        memoryEnabled: true,
        summary: '',
        summaryUpToMessageId: null,
        createdAt: now,
        updatedAt: now,
      };
      setConversations((prev) => [newConv, ...prev]);
      setActiveConversationId(newConv.id);
      setActiveBotId(bot.id);
      setShowArchived(false);
      void idbStorage.putConversation(newConv);
    },
    [activeBotId, bots]
  );

  const handleSelectConversation = useCallback(
    (convId: string) => {
      setActiveConversationId(convId);
      const conv = conversations.find((c) => c.id === convId);
      if (conv) setActiveBotId(conv.botId);
    },
    [conversations]
  );

  const handleRenameConversation = useCallback(
    (convId: string, newTitle: string) => {
      setConversations((prev) =>
        prev.map((c) => {
          if (c.id !== convId) return c;
          const updated = { ...c, title: newTitle, updatedAt: Date.now() };
          void idbStorage.putConversation(updated);
          return updated;
        })
      );
    },
    []
  );

  const handleDuplicateConversation = useCallback(
    (convId: string) => {
      const orig = conversations.find((c) => c.id === convId);
      if (!orig) return;
      const now = Date.now();
      const newId = `conv_${now}_${Math.random().toString(36).slice(2, 6)}`;
      const clonedConv: Conversation = {
        ...orig,
        id: newId,
        title: `${orig.title} (Copia)`,
        createdAt: now,
        updatedAt: now,
      };
      const origMsgs = messages.filter((m) => m.conversationId === convId);
      const clonedMsgs = origMsgs.map((m, idx) => ({
        ...m,
        id: `msg_${now}_${idx}`,
        conversationId: newId,
      }));
      const origMems = memories.filter((m) => m.conversationId === convId);
      const clonedMems = origMems.map((m, idx) => ({
        ...m,
        id: `mem_${now}_${idx}`,
        conversationId: newId,
      }));

      setConversations((prev) => [clonedConv, ...prev]);
      setMessages((prev) => [...prev, ...clonedMsgs]);
      setMemories((prev) => [...prev, ...clonedMems]);
      setActiveConversationId(newId);

      void idbStorage.putConversation(clonedConv);
      clonedMsgs.forEach((m) => void idbStorage.putMessage(m));
      clonedMems.forEach((m) => void idbStorage.putMemory(m));
      showToast('Conversación duplicada con memoria independiente.');
    },
    [conversations, messages, memories, showToast]
  );

  const handleToggleArchive = useCallback((convId: string) => {
    setConversations((prev) =>
      prev.map((c) => {
        if (c.id !== convId) return c;
        const updated = { ...c, archived: !c.archived, updatedAt: Date.now() };
        void idbStorage.putConversation(updated);
        return updated;
      })
    );
  }, []);

  const handleDeleteConversation = useCallback(
    (convId: string) => {
      const msgsToDelete = messages.filter((m) => m.conversationId === convId);
      const memsToDelete = memories.filter((m) => m.conversationId === convId);

      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== convId);
        if (activeConversationId === convId) {
          setActiveConversationId(remaining[0]?.id ?? null);
        }
        return remaining;
      });
      setMessages((prev) => prev.filter((m) => m.conversationId !== convId));
      setMemories((prev) => prev.filter((m) => m.conversationId !== convId));

      void idbStorage.deleteConversation(convId);
      msgsToDelete.forEach((m) => void idbStorage.deleteMessage(m.id));
      memsToDelete.forEach((m) => void idbStorage.deleteMemory(m.id));
    },
    [messages, memories, activeConversationId]
  );

  // Bot CRUD
  const handleSaveBot = useCallback((bot: Bot) => {
    setBots((prev) => {
      const exists = prev.some((b) => b.id === bot.id);
      return exists ? prev.map((b) => (b.id === bot.id ? bot : b)) : [bot, ...prev];
    });
    setActiveBotId(bot.id);
    void idbStorage.putBot(bot);
    showToast(`Bot "${bot.name}" guardado.`);
  }, [showToast]);

  const handleDuplicateBot = useCallback(
    (botId: string) => {
      const orig = bots.find((b) => b.id === botId);
      if (!orig) return;
      const now = Date.now();
      const copy: Bot = {
        ...orig,
        id: `bot_${now}`,
        name: `${orig.name} (Copia)`,
        createdAt: now,
        updatedAt: now,
      };
      setBots((prev) => [copy, ...prev]);
      void idbStorage.putBot(copy);
      showToast('Bot duplicado.');
    },
    [bots, showToast]
  );

  const handleDeleteBot = useCallback(
    (botId: string) => {
      if (bots.length <= 1) return;
      setBots((prev) => {
        const next = prev.filter((b) => b.id !== botId);
        if (activeBotId === botId && next[0]) {
          setActiveBotId(next[0].id);
        }
        return next;
      });
      void idbStorage.deleteBot(botId);
    },
    [bots.length, activeBotId]
  );

  // Attachments
  const handleAddAttachments = useCallback(
    async (files: FileList) => {
      const next: ChatAttachment[] = [];
      for (const file of Array.from(files)) {
        const isImage = file.type.startsWith('image/');
        if (isImage && !supportsVision) {
          showToast(
            'El modelo seleccionado no tiene entrada visual habilitada.'
          );
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          showToast(`El archivo ${file.name} supera el límite de 10 MB.`);
          continue;
        }

        const dataUrl = await readFileAsDataUrl(file);
        if (isImage) {
          next.push({
            id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            mimeType: file.type,
            size: file.size,
            dataUrl,
            kind: 'image',
          });
        } else {
          const textContent = await readFileAsText(file);
          next.push({
            id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            name: file.name,
            mimeType: file.type || 'text/plain',
            size: file.size,
            dataUrl,
            kind: 'text',
            textContent: textContent.slice(0, 60000),
          });
        }
      }
      if (next.length > 0) {
        setComposerAttachments((prev) => [...prev, ...next]);
      }
    },
    [supportsVision, showToast]
  );

  // Execute completion for a given conversation & message history
  const runAssistantTurn = useCallback(
    async (
      targetConv: Conversation,
      targetBot: Bot,
      updatedAllMessages: ChatMessage[],
      updatedAllMemories: MemoryItem[]
    ) => {
      const now = Date.now();
      const assistantMsgId = `msg_${now}_ai`;
      const placeholder: ChatMessage = {
        id: assistantMsgId,
        conversationId: targetConv.id,
        role: 'assistant',
        content: '',
        createdAt: now,
      };

      const messagesWithPlaceholder = [...updatedAllMessages, placeholder];
      setMessages(messagesWithPlaceholder);
      setIsStreaming(true);

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const effectiveSupportsVision = Boolean(
        apiConfig.supportsVision && targetBot.supportsVision
      );

      const ctx = assembleApiContext({
        bot: targetBot,
        apiConfig,
        conversation: targetConv,
        allMessages: updatedAllMessages,
        allMemories: updatedAllMemories,
        supportsVision: effectiveSupportsVision,
      });

      try {
        const result = await sendChatCompletion({
          apiConfig,
          bot: targetBot,
          messages: ctx.apiMessages,
          signal: controller.signal,
          onToken: (accumulated) => {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: accumulated } : m
              )
            );
          },
        });

        if (result.warning) showToast(result.warning);

        const finalMsg: ChatMessage = {
          ...placeholder,
          content: result.content,
          updatedAt: Date.now(),
        };
        setMessages((prev) =>
          prev.map((m) => (m.id === assistantMsgId ? finalMsg : m))
        );
        void idbStorage.putMessage(finalMsg);

        // Update progressive contextual summary if conversation grew past threshold
        const convMsgsNow = [...updatedAllMessages, finalMsg].filter(
          (m) => m.conversationId === targetConv.id
        );
        const sumCheck = shouldUpdateSummary(targetConv, convMsgsNow);
        if (sumCheck.needed && targetConv.memoryEnabled) {
          const nextSummary = buildProgressiveSummary(
            targetConv.summary,
            sumCheck.messagesToSummarize
          );
          const updatedConv: Conversation = {
            ...targetConv,
            summary: nextSummary,
            summaryUpToMessageId: sumCheck.newestCoveredId,
            updatedAt: Date.now(),
          };
          setConversations((prev) =>
            prev.map((c) => (c.id === targetConv.id ? updatedConv : c))
          );
          void idbStorage.putConversation(updatedConv);
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          setMessages((prev) => {
            const current = prev.find((m) => m.id === assistantMsgId);
            if (current && current.content.trim()) {
              void idbStorage.putMessage(current);
              return prev;
            }
            return prev.filter((m) => m.id !== assistantMsgId);
          });
        } else {
          const errMsg = (err as Error)?.message || 'Error al comunicarse con la API.';
          const failedMsg: ChatMessage = {
            ...placeholder,
            content: '',
            error: errMsg,
            updatedAt: Date.now(),
          };
          setMessages((prev) =>
            prev.map((m) => (m.id === assistantMsgId ? failedMsg : m))
          );
          void idbStorage.putMessage(failedMsg);
        }
      } finally {
        abortControllerRef.current = null;
        setIsStreaming(false);
      }
    },
    [apiConfig, showToast]
  );

  // Send user message
  const handleSendMessage = useCallback(
    async (overridePrompt?: string) => {
      if (isStreaming || !activeBot) return;
      const text = (overridePrompt ?? composerInput).trim();
      const atts = overridePrompt ? [] : composerAttachments;
      if (!text && atts.length === 0) return;

      let targetConv = activeConversation;
      if (!targetConv) {
        const now = Date.now();
        targetConv = {
          id: `conv_${now}`,
          botId: activeBot.id,
          title: text.slice(0, 46) || `Chat con ${activeBot.name}`,
          archived: false,
          memoryEnabled: true,
          summary: '',
          summaryUpToMessageId: null,
          createdAt: now,
          updatedAt: now,
        };
        setConversations((prev) => [targetConv!, ...prev]);
        setActiveConversationId(targetConv.id);
      }

      const now = Date.now();
      const existingInConv = messages.filter(
        (m) => m.conversationId === targetConv!.id
      );
      const shouldRetitle =
        existingInConv.length === 0 &&
        targetConv.title.startsWith('Nuevo chat');
      const updatedConv: Conversation = {
        ...targetConv,
        title: shouldRetitle
          ? (text || atts[0]?.name || targetConv.title).slice(0, 48)
          : targetConv.title,
        updatedAt: now,
      };
      setConversations((prev) =>
        prev.map((c) => (c.id === updatedConv.id ? updatedConv : c))
      );
      void idbStorage.putConversation(updatedConv);

      const userMsg: ChatMessage = {
        id: `msg_${now}_u`,
        conversationId: updatedConv.id,
        role: 'user',
        content: text,
        attachments: atts.length > 0 ? atts : undefined,
        createdAt: now,
      };

      const nextAllMessages = [...messages, userMsg];
      setMessages(nextAllMessages);
      void idbStorage.putMessage(userMsg);

      if (!overridePrompt) {
        setComposerInput('');
        setComposerAttachments([]);
      }

      // Extract isolated memories solely from this conversation
      let nextAllMemories = memories;
      if (updatedConv.memoryEnabled) {
        const candidates = extractMemoryCandidates(
          updatedConv.id,
          [userMsg],
          memories
        );
        if (candidates.length > 0) {
          nextAllMemories = [...memories, ...candidates];
          setMemories(nextAllMemories);
          candidates.forEach((m) => void idbStorage.putMemory(m));
        }
      }

      await runAssistantTurn(
        updatedConv,
        activeBot,
        nextAllMessages,
        nextAllMemories
      );
    },
    [
      isStreaming,
      activeBot,
      composerInput,
      composerAttachments,
      activeConversation,
      messages,
      memories,
      runAssistantTurn,
    ]
  );

  const handleStopGeneration = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleEditMessage = useCallback(
    async (messageId: string, newContent: string) => {
      if (isStreaming || !activeConversation || !activeBot) return;
      const target = messages.find((m) => m.id === messageId);
      if (!target) return;

      // Remove messages strictly after this edited turn inside this conversation
      const toRemove = messages.filter(
        (m) =>
          m.conversationId === activeConversation.id &&
          m.createdAt > target.createdAt
      );
      const updatedTarget: ChatMessage = {
        ...target,
        content: newContent,
        updatedAt: Date.now(),
      };
      const nextMessages = messages
        .filter((m) => !toRemove.some((r) => r.id === m.id))
        .map((m) => (m.id === messageId ? updatedTarget : m));

      setMessages(nextMessages);
      void idbStorage.putMessage(updatedTarget);
      toRemove.forEach((r) => void idbStorage.deleteMessage(r.id));

      await runAssistantTurn(activeConversation, activeBot, nextMessages, memories);
    },
    [isStreaming, activeConversation, activeBot, messages, memories, runAssistantTurn]
  );

  const handleRegenerate = useCallback(async () => {
    if (isStreaming || !activeConversation || !activeBot) return;
    const convMsgs = messages
      .filter((m) => m.conversationId === activeConversation.id)
      .sort((a, b) => a.createdAt - b.createdAt);
    const last = convMsgs[convMsgs.length - 1];
    if (!last || last.role !== 'assistant') return;

    const trimmed = messages.filter((m) => m.id !== last.id);
    setMessages(trimmed);
    void idbStorage.deleteMessage(last.id);

    await runAssistantTurn(activeConversation, activeBot, trimmed, memories);
  }, [isStreaming, activeConversation, activeBot, messages, memories, runAssistantTurn]);

  const handleTogglePin = useCallback((messageId: string) => {
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const updated = { ...m, pinned: !m.pinned };
        void idbStorage.putMessage(updated);
        return updated;
      })
    );
  }, []);

  const handleDeleteMessage = useCallback((messageId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== messageId));
    void idbStorage.deleteMessage(messageId);
  }, []);

  // Isolated Memory Drawer Handlers
  const handleToggleMemoryEnabled = useCallback(() => {
    if (!activeConversation) return;
    const updated = {
      ...activeConversation,
      memoryEnabled: !activeConversation.memoryEnabled,
    };
    setConversations((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    void idbStorage.putConversation(updated);
  }, [activeConversation]);

  const handleAddMemory = useCallback(
    (content: string, importance: 'high' | 'normal') => {
      if (!activeConversation) return;
      const item: MemoryItem = {
        id: `mem_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        conversationId: activeConversation.id,
        content,
        importance,
        source: 'manual',
        createdAt: Date.now(),
      };
      setMemories((prev) => [item, ...prev]);
      void idbStorage.putMemory(item);
    },
    [activeConversation]
  );

  const handleEditMemory = useCallback(
    (memoryId: string, content: string, importance: 'high' | 'normal') => {
      setMemories((prev) =>
        prev.map((m) => {
          if (m.id !== memoryId) return m;
          const updated = { ...m, content, importance };
          void idbStorage.putMemory(updated);
          return updated;
        })
      );
    },
    []
  );

  const handleDeleteMemory = useCallback((memoryId: string) => {
    setMemories((prev) => prev.filter((m) => m.id !== memoryId));
    void idbStorage.deleteMemory(memoryId);
  }, []);

  const handleUpdateSummary = useCallback(
    (summary: string) => {
      if (!activeConversation) return;
      const updated = { ...activeConversation, summary, updatedAt: Date.now() };
      setConversations((prev) =>
        prev.map((c) => (c.id === updated.id ? updated : c))
      );
      void idbStorage.putConversation(updated);
    },
    [activeConversation]
  );

  const handleRegenerateSummary = useCallback(() => {
    if (!activeConversation) return;
    const convMsgs = messages
      .filter((m) => m.conversationId === activeConversation.id)
      .sort((a, b) => a.createdAt - b.createdAt);
    const nextSummary = buildProgressiveSummary('', convMsgs);
    const updated: Conversation = {
      ...activeConversation,
      summary: nextSummary,
      summaryUpToMessageId: convMsgs[convMsgs.length - 1]?.id ?? null,
      updatedAt: Date.now(),
    };
    setConversations((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    );
    void idbStorage.putConversation(updated);
    showToast('Resumen contextual actualizado para esta conversación.');
  }, [activeConversation, messages, showToast]);

  // JSON Export / Import
  const handleExportBackup = useCallback(() => {
    const bundle: ExportBundle = {
      version: 1,
      exportedAt: Date.now(),
      glassConfig,
      generalSettings,
      bots,
      conversations,
      messages,
      memories,
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `liquid-ai-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Respaldo JSON exportado.');
  }, [glassConfig, generalSettings, bots, conversations, messages, memories, showToast]);

  const handleImportBackup = useCallback(async (file: File) => {
    const text = await readFileAsText(file);
    const raw = JSON.parse(text);
    const bundle = validateExportBundle(raw);

    await replaceAllWorkspaceData({
      bots: bundle.bots,
      conversations: bundle.conversations,
      messages: bundle.messages,
      memories: bundle.memories,
    });

    setBots(bundle.bots);
    setConversations(bundle.conversations);
    setMessages(bundle.messages);
    setMemories(bundle.memories);

    if (bundle.glassConfig) {
      setGlassConfig(sanitizeGlassConfig(bundle.glassConfig));
    }
    if (bundle.generalSettings) {
      setGeneralSettings((prev) => ({ ...prev, ...bundle.generalSettings }));
    }

    setActiveConversationId(bundle.conversations[0]?.id ?? null);
    setActiveBotId(bundle.bots[0]?.id ?? '');
  }, []);

  return (
    <div className="relative flex h-[100dvh] w-full overflow-hidden text-slate-900 dark:text-slate-100">
      {/* Global SVG Optical Displacement & Dispersion Filters */}
      <GlassFilterDefs
        displacementScale={computedGlass.displacementScale}
        buttonDisplacementScale={computedGlass.buttonDisplacementScale}
        glassDepth={glassConfig.glassDepth}
        chromaticPx={computedGlass.chromaticPx}
        refractionActive={computedGlass.refractionActive}
      />

      {/* Adaptive Optical Backdrop & WebGL Caustic Canvas */}
      <AmbientLiquidCanvas
        theme={generalSettings.theme}
        backgroundMode={generalSettings.backgroundMode}
        customBackgroundDataUrl={generalSettings.customBackgroundDataUrl}
        accentColor={generalSettings.accentColor}
        lightingIntensity={glassConfig.lightingIntensity}
        animationSpeed={glassConfig.animationSpeed}
        animationsActive={computedGlass.animationsActive}
        reducedEffects={reducedEffects}
      />

      {/* Main Workspace Layout */}
      <div className="relative z-10 flex h-full w-full gap-2.5 p-2 sm:gap-3 sm:p-3">
        <Sidebar
          open={mobileSidebarOpen}
          onCloseMobile={() => setMobileSidebarOpen(false)}
          collapsedDesktop={desktopSidebarCollapsed}
          onToggleCollapseDesktop={() => setDesktopSidebarCollapsed(true)}
          bots={bots}
          activeBotId={activeBot?.id ?? activeBotId}
          onSelectBot={(id) => {
            setActiveBotId(id);
            handleNewChat(id);
          }}
          conversations={filteredConversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewChat={handleNewChat}
          onRenameConversation={handleRenameConversation}
          onDuplicateConversation={handleDuplicateConversation}
          onToggleArchiveConversation={handleToggleArchive}
          onDeleteConversation={handleDeleteConversation}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          showArchived={showArchived}
          onToggleShowArchived={() => setShowArchived((v) => !v)}
          onOpenBotsModal={() => setBotsModalOpen(true)}
          onOpenGlassEngine={() => setGlassEngineOpen(true)}
          onOpenSettings={() => setSettingsOpen(true)}
        />

        {/* Center Chat Area */}
        <main className="flex min-w-0 flex-1 flex-col gap-2 sm:gap-3">
          <TopBar
            collapsedDesktop={desktopSidebarCollapsed}
            onExpandDesktop={() => setDesktopSidebarCollapsed(false)}
            onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
            activeBot={activeBot}
            activeConversation={activeConversation}
            apiConfig={apiConfig}
            memoryCount={activeMemories.length + pinnedMessages.length}
            memoryDrawerOpen={memoryDrawerOpen}
            onToggleMemoryDrawer={() => setMemoryDrawerOpen((v) => !v)}
            theme={generalSettings.theme}
            onToggleTheme={() =>
              setGeneralSettings((prev) => ({
                ...prev,
                theme: prev.theme === 'dark' ? 'light' : 'dark',
              }))
            }
            onOpenSettings={() => setSettingsOpen(true)}
          />

          <ChatViewport
            messages={activeMessages}
            activeBot={activeBot}
            apiConfig={apiConfig}
            density={generalSettings.density}
            isStreaming={isStreaming}
            onEditMessage={handleEditMessage}
            onRegenerate={handleRegenerate}
            onTogglePin={handleTogglePin}
            onDeleteMessage={handleDeleteMessage}
            onOpenSettings={() => setSettingsOpen(true)}
            onQuickPrompt={(p) => handleSendMessage(p)}
          />

          <Composer
            input={composerInput}
            onInputChange={setComposerInput}
            attachments={composerAttachments}
            onAddAttachments={handleAddAttachments}
            onRemoveAttachment={(id) =>
              setComposerAttachments((prev) => prev.filter((a) => a.id !== id))
            }
            supportsVision={supportsVision}
            isStreaming={isStreaming}
            onSend={() => handleSendMessage()}
            onStopGeneration={handleStopGeneration}
          />
        </main>

        {/* Right Isolated Memory Inspector Drawer */}
        {activeConversation && (
          <MemoryDrawer
            open={memoryDrawerOpen}
            onClose={() => setMemoryDrawerOpen(false)}
            conversation={activeConversation}
            memories={activeMemories}
            pinnedMessages={pinnedMessages}
            contextPreview={contextPreview}
            onToggleMemoryEnabled={handleToggleMemoryEnabled}
            onAddMemory={handleAddMemory}
            onEditMemory={handleEditMemory}
            onDeleteMemory={handleDeleteMemory}
            onUpdateSummary={handleUpdateSummary}
            onRegenerateSummary={handleRegenerateSummary}
            onUnpinMessage={handleTogglePin}
          />
        )}
      </div>

      {/* Modals */}
      <GlassEngineModal
        open={glassEngineOpen}
        onClose={() => setGlassEngineOpen(false)}
        config={glassConfig}
        onChange={setGlassConfig}
      />

      <BotsManagerModal
        open={botsModalOpen}
        onClose={() => setBotsModalOpen(false)}
        bots={bots}
        activeBotId={activeBot?.id ?? activeBotId}
        onSelectBotAndStartChat={(botId) => handleNewChat(botId)}
        onSaveBot={handleSaveBot}
        onDuplicateBot={handleDuplicateBot}
        onDeleteBot={handleDeleteBot}
      />

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        apiConfig={apiConfig}
        onChangeApiConfig={setApiConfig}
        generalSettings={generalSettings}
        onChangeGeneralSettings={setGeneralSettings}
        onExportBackup={handleExportBackup}
        onImportBackup={handleImportBackup}
      />

      {/* Subtle Glass Toast Notification */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="liquid-glass fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-2xl px-4 py-2.5 text-xs font-medium text-slate-900 shadow-lg dark:text-slate-100"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
