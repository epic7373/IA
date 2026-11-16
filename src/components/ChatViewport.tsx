import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowDown,
  Bookmark,
  BookmarkCheck,
  Check,
  Copy,
  Edit3,
  FileText,
  RefreshCw,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import type { ApiConfig, Bot, ChatMessage, UiDensity } from '../types/liquid';
import { LiquidGlassSurface } from './LiquidGlassSurface';
import { MarkdownRenderer } from './MarkdownRenderer';

interface MessageItemProps {
  message: ChatMessage;
  bot: Bot | null;
  density: UiDensity;
  isLastAssistant: boolean;
  isStreaming: boolean;
  onCopy: (text: string) => void;
  onEditMessage: (messageId: string, newContent: string) => void;
  onRegenerate: () => void;
  onTogglePin: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = React.memo(
  ({
    message,
    bot,
    density,
    isLastAssistant,
    isStreaming,
    onCopy,
    onEditMessage,
    onRegenerate,
    onTogglePin,
    onDeleteMessage,
  }) => {
    const [copied, setCopied] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [draft, setDraft] = useState(message.content);

    const isUser = message.role === 'user';
    const padClass =
      density === 'compact'
        ? 'px-3.5 py-2.5'
        : density === 'airy'
          ? 'px-5 py-4'
          : 'px-4 py-3.5';

    const handleCopy = () => {
      onCopy(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    };

    const handleSaveEdit = () => {
      const trimmed = draft.trim();
      if (trimmed) {
        onEditMessage(message.id, trimmed);
      }
      setIsEditing(false);
    };

    return (
      <article
        className={`group flex w-full gap-3 ${
          isUser ? 'justify-end' : 'justify-start'
        }`}
      >
        {!isUser && bot?.avatar && (
          <img
            src={bot.avatar}
            alt={bot.name}
            referrerPolicy="no-referrer"
            className="mt-1 hidden h-8 w-8 shrink-0 rounded-xl object-cover ring-1 ring-white/30 sm:block"
          />
        )}

        <div
          className={`flex min-w-0 max-w-[94%] flex-col gap-1.5 sm:max-w-[82%] ${
            isUser ? 'items-end' : 'items-start'
          }`}
        >
          {/* Sender + Timestamp metadata */}
          <div className="flex items-center gap-2 px-1 text-[11px] text-slate-600 dark:text-slate-400">
            <span className="font-medium">
              {isUser ? 'Tú' : bot?.name ?? 'Asistente'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
            {message.pinned && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-sky-600 dark:text-sky-400">
                  Fijado en memoria
                </span>
              </>
            )}
          </div>

          <LiquidGlassSurface
            variant="bubble"
            refract={!isUser}
            className={`w-full ${padClass} ${
              isUser
                ? 'bg-sky-500/18 text-slate-900 dark:bg-sky-400/18 dark:text-slate-50'
                : 'text-slate-900 dark:text-slate-100'
            }`}
          >
            {/* Attachments */}
            {message.attachments && message.attachments.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-2">
                {message.attachments.map((att) =>
                  att.kind === 'image' ? (
                    <img
                      key={att.id}
                      src={att.dataUrl}
                      alt={att.name}
                      referrerPolicy="no-referrer"
                      className="max-h-56 rounded-xl object-cover ring-1 ring-white/25"
                    />
                  ) : (
                    <div
                      key={att.id}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-300/60 bg-white/40 px-3 py-1.5 text-xs dark:border-white/15 dark:bg-slate-900/50"
                    >
                      <FileText className="h-3.5 w-3.5 shrink-0" />
                      <span className="max-w-[200px] truncate">{att.name}</span>
                    </div>
                  )
                )}
              </div>
            )}

            {/* Content or Edit Form */}
            {isEditing ? (
              <div className="space-y-2">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={3}
                  aria-label="Editar mensaje"
                  className="w-full rounded-xl border border-sky-500/50 bg-white/75 p-2.5 text-sm text-slate-900 outline-none dark:bg-slate-900/75 dark:text-slate-100"
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(message.content);
                      setIsEditing(false);
                    }}
                    className="liquid-glass-button inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium"
                  >
                    <X className="h-3.5 w-3.5" />
                    <span>Cancelar</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="liquid-glass-button liquid-glass-button-accent inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium"
                  >
                    <Check className="h-3.5 w-3.5" />
                    <span>Guardar y reenviar</span>
                  </button>
                </div>
              </div>
            ) : message.error ? (
              <div className="rounded-xl border border-rose-500/35 bg-rose-500/12 p-3 text-sm text-rose-700 dark:text-rose-300">
                <p className="font-medium">No se pudo completar la respuesta</p>
                <p className="mt-1 text-xs opacity-90">{message.error}</p>
              </div>
            ) : isUser ? (
              <div className="whitespace-pre-wrap text-[15px] leading-relaxed">
                {message.content}
              </div>
            ) : message.content ? (
              <MarkdownRenderer content={message.content} />
            ) : isStreaming ? (
              <div className="flex items-center gap-2 py-1 text-xs text-slate-500 dark:text-slate-400">
                <span className="inline-block h-2 w-2 rounded-full bg-sky-500 animate-ping" />
                <span>Generando respuesta...</span>
              </div>
            ) : null}
          </LiquidGlassSurface>

          {/* Message Actions */}
          {!isEditing && !isStreaming && (
            <div className="flex flex-wrap items-center gap-1 px-1 opacity-85 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100">
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copiar mensaje"
                title="Copiar mensaje"
                className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-900/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>

              {isUser && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(message.content);
                    setIsEditing(true);
                  }}
                  aria-label="Editar mensaje"
                  title="Editar mensaje"
                  className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-900/10 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Editar</span>
                </button>
              )}

              {!isUser && isLastAssistant && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  aria-label="Regenerar respuesta"
                  title="Regenerar respuesta"
                  className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-900/10 dark:text-slate-300 dark:hover:bg-white/10"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  <span>Regenerar</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onTogglePin(message.id)}
                aria-label={message.pinned ? 'Quitar fijado' : 'Fijar en memoria'}
                title={message.pinned ? 'Quitar fijado' : 'Fijar en memoria'}
                className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-slate-600 hover:bg-slate-900/10 dark:text-slate-300 dark:hover:bg-white/10"
              >
                {message.pinned ? (
                  <BookmarkCheck className="h-3.5 w-3.5 text-sky-500" />
                ) : (
                  <Bookmark className="h-3.5 w-3.5" />
                )}
                <span>{message.pinned ? 'Fijado' : 'Fijar'}</span>
              </button>

              <button
                type="button"
                onClick={() => onDeleteMessage(message.id)}
                aria-label="Eliminar mensaje"
                title="Eliminar mensaje"
                className="inline-flex min-h-[32px] items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Eliminar</span>
              </button>
            </div>
          )}
        </div>
      </article>
    );
  }
);

interface ChatViewportProps {
  messages: ChatMessage[];
  activeBot: Bot | null;
  apiConfig: ApiConfig;
  density: UiDensity;
  isStreaming: boolean;
  onEditMessage: (messageId: string, newContent: string) => void;
  onRegenerate: () => void;
  onTogglePin: (messageId: string) => void;
  onDeleteMessage: (messageId: string) => void;
  onOpenSettings: () => void;
  onQuickPrompt: (prompt: string) => void;
}

export const ChatViewport: React.FC<ChatViewportProps> = ({
  messages,
  activeBot,
  apiConfig,
  density,
  isStreaming,
  onEditMessage,
  onRegenerate,
  onTogglePin,
  onDeleteMessage,
  onOpenSettings,
  onQuickPrompt,
}) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [autoScrollLocked, setAutoScrollLocked] = useState(true);

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    setAutoScrollLocked(distanceFromBottom < 80);
  };

  useEffect(() => {
    if (autoScrollLocked && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming, autoScrollLocked]);

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth',
      });
      setAutoScrollLocked(true);
    }
  };

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Clipboard blocked
    }
  };

  const lastAssistantId = [...messages]
    .reverse()
    .find((m) => m.role === 'assistant')?.id;

  const isLocalEndpoint =
    apiConfig.baseUrl.includes('localhost') ||
    apiConfig.baseUrl.includes('127.0.0.1');
  const needsApiSetup =
    !apiConfig.baseUrl.trim() ||
    !apiConfig.modelId.trim() ||
    (!apiConfig.apiKey.trim() && !isLocalEndpoint);

  const spacingClass =
    density === 'compact'
      ? 'space-y-3'
      : density === 'airy'
        ? 'space-y-6'
        : 'space-y-4';

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="liquid-scroll flex-1 overflow-y-auto px-2 py-4 sm:px-6"
      >
        <div className={`mx-auto max-w-4xl ${spacingClass}`}>
          {/* Empty / Greeting State */}
          {messages.length === 0 && activeBot && (
            <div className="py-8 sm:py-12">
              <LiquidGlassSurface
                variant="elevated"
                className="mx-auto max-w-2xl p-6 sm:p-8 text-slate-900 dark:text-slate-100"
              >
                <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
                  <img
                    src={activeBot.avatar}
                    alt={activeBot.name}
                    referrerPolicy="no-referrer"
                    className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-1 ring-white/40"
                  />
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold tracking-tight">
                      {activeBot.name}
                    </h2>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      {activeBot.description}
                    </p>
                  </div>
                </div>

                {activeBot.greeting && (
                  <p className="mt-5 rounded-2xl border border-slate-300/50 bg-white/40 p-4 text-sm leading-relaxed text-slate-800 dark:border-white/15 dark:bg-slate-900/45 dark:text-slate-200">
                    {activeBot.greeting}
                  </p>
                )}

                {needsApiSetup && (
                  <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-slate-800 dark:text-slate-200">
                      <strong>Conexión pendiente:</strong> Configura tu API Key, URL base y modelo para recibir respuestas reales.
                    </div>
                    <button
                      type="button"
                      onClick={onOpenSettings}
                      className="liquid-glass-button liquid-glass-button-accent inline-flex min-h-[40px] shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      <span>Configurar API</span>
                    </button>
                  </div>
                )}

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {[
                    'Resume tus capacidades y cómo puedes ayudarme hoy.',
                    'Diseña una arquitectura modular en TypeScript con buenas prácticas.',
                  ].map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => onQuickPrompt(starter)}
                      className="liquid-glass-button rounded-xl p-3 text-left text-xs font-medium text-slate-700 dark:text-slate-200"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </LiquidGlassSurface>
            </div>
          )}

          {messages.map((msg) => (
            <MessageItem
              key={msg.id}
              message={msg}
              bot={activeBot}
              density={density}
              isLastAssistant={msg.id === lastAssistantId}
              isStreaming={isStreaming && msg.id === lastAssistantId}
              onCopy={handleCopy}
              onEditMessage={onEditMessage}
              onRegenerate={onRegenerate}
              onTogglePin={onTogglePin}
              onDeleteMessage={onDeleteMessage}
            />
          ))}
        </div>
      </div>

      {/* Smart Scroll-To-Bottom Button */}
      {!autoScrollLocked && messages.length > 0 && (
        <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex justify-center">
          <button
            type="button"
            onClick={scrollToBottom}
            aria-label="Ir al último mensaje"
            className="liquid-glass-button pointer-events-auto inline-flex min-h-[38px] items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium text-slate-800 dark:text-slate-100"
          >
            <ArrowDown className="h-3.5 w-3.5" />
            <span>Ir al final</span>
          </button>
        </div>
      )}
    </div>
  );
};
