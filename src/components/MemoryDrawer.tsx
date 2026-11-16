import React, { useState } from 'react';
import {
  Bookmark,
  Brain,
  Check,
  Edit3,
  Eye,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import type { AssembledContext } from '../core/memoryEngine';
import type { ChatMessage, Conversation, MemoryItem } from '../types/liquid';
import { LiquidGlassSurface } from './LiquidGlassSurface';

interface MemoryDrawerProps {
  open: boolean;
  onClose: () => void;
  conversation: Conversation;
  memories: MemoryItem[];
  pinnedMessages: ChatMessage[];
  contextPreview: AssembledContext;
  onToggleMemoryEnabled: () => void;
  onAddMemory: (content: string, importance: 'high' | 'normal') => void;
  onEditMemory: (memoryId: string, content: string, importance: 'high' | 'normal') => void;
  onDeleteMemory: (memoryId: string) => void;
  onUpdateSummary: (summary: string) => void;
  onRegenerateSummary: () => void;
  onUnpinMessage: (messageId: string) => void;
}

export const MemoryDrawer: React.FC<MemoryDrawerProps> = ({
  open,
  onClose,
  conversation,
  memories,
  pinnedMessages,
  contextPreview,
  onToggleMemoryEnabled,
  onAddMemory,
  onEditMemory,
  onDeleteMemory,
  onUpdateSummary,
  onRegenerateSummary,
  onUnpinMessage,
}) => {
  const [newMemoryText, setNewMemoryText] = useState('');
  const [newImportance, setNewImportance] = useState<'high' | 'normal'>('normal');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [editImportance, setEditImportance] = useState<'high' | 'normal'>('normal');
  const [editingSummary, setEditingSummary] = useState(false);
  const [summaryDraft, setSummaryDraft] = useState(conversation.summary);
  const [showContextModal, setShowContextModal] = useState(false);

  if (!open) return null;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMemoryText.trim();
    if (!trimmed) return;
    onAddMemory(trimmed, newImportance);
    setNewMemoryText('');
    setNewImportance('normal');
  };

  const startEdit = (mem: MemoryItem) => {
    setEditingId(mem.id);
    setEditDraft(mem.content);
    setEditImportance(mem.importance);
  };

  const saveEdit = (memoryId: string) => {
    const trimmed = editDraft.trim();
    if (trimmed) {
      onEditMemory(memoryId, trimmed, editImportance);
    }
    setEditingId(null);
  };

  const content = (
    <LiquidGlassSurface
      as="aside"
      variant="panel"
      className="flex h-full w-full flex-col overflow-hidden p-4 text-slate-900 dark:text-slate-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-slate-300/40 pb-3 dark:border-white/10">
        <div className="flex items-center gap-2 min-w-0">
          <Brain className="h-5 w-5 shrink-0 text-sky-500" />
          <div className="min-w-0">
            <h2 className="truncate text-sm font-bold">Memoria aislada</h2>
            <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">
              Exclusiva de este chat · Sin mezcla entre sesiones
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar panel de memoria"
          className="liquid-glass-button inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="liquid-scroll mt-3 flex-1 space-y-5 overflow-y-auto pr-1">
        {/* Enable/Disable Toggle + Context Telemetry */}
        <div className="rounded-2xl border border-slate-300/50 bg-white/35 p-3 dark:border-white/12 dark:bg-slate-900/40">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-xs font-semibold">Memoria activa en este chat</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Incluye recuerdos, fijados y resumen al enviar a la API
              </div>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={conversation.memoryEnabled}
              aria-label="Activar o desactivar memoria de esta conversación"
              onClick={onToggleMemoryEnabled}
              className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
                conversation.memoryEnabled
                  ? 'bg-sky-500'
                  : 'bg-slate-400/50 dark:bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                  conversation.memoryEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="mt-3 flex items-center justify-between border-t border-slate-300/40 pt-2.5 text-[11px] text-slate-600 dark:border-white/10 dark:text-slate-300">
            <span className="tabular-nums">
              Contexto aprox: {contextPreview.estimatedTokens} tokens · {contextPreview.includedMessageCount} msgs
            </span>
            <button
              type="button"
              onClick={() => setShowContextModal((v) => !v)}
              className="inline-flex items-center gap-1 font-medium text-sky-600 hover:underline dark:text-sky-400"
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{showContextModal ? 'Ocultar' : 'Ver contexto'}</span>
            </button>
          </div>

          {showContextModal && (
            <div className="mt-2.5 max-h-44 overflow-y-auto rounded-xl border border-slate-300/50 bg-slate-950/5 p-2.5 font-mono text-[11px] leading-relaxed whitespace-pre-wrap dark:border-white/10 dark:bg-slate-950/60">
              {contextPreview.systemBlock || '(Sin instrucciones ni recuerdos acumulados aún)'}
            </div>
          )}
        </div>

        {/* Add Memory Form */}
        <section>
          <h3 className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            Recuerdos de la conversación ({memories.length})
          </h3>
          <form onSubmit={handleAdd} className="space-y-2">
            <textarea
              value={newMemoryText}
              onChange={(e) => setNewMemoryText(e.target.value)}
              rows={2}
              placeholder="Añade un hecho o preferencia solo para esta conversación..."
              aria-label="Nuevo recuerdo manual"
              className="w-full rounded-xl border border-slate-300/60 bg-white/50 p-2.5 text-xs text-slate-900 placeholder:text-slate-500 outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/15 dark:bg-slate-900/50 dark:text-slate-100"
            />
            <div className="flex items-center justify-between gap-2">
              <select
                value={newImportance}
                onChange={(e) =>
                  setNewImportance(e.target.value as 'high' | 'normal')
                }
                aria-label="Importancia del recuerdo"
                className="rounded-xl border border-slate-300/60 bg-white/55 px-2.5 py-1.5 text-xs dark:border-white/15 dark:bg-slate-900/60"
              >
                <option value="normal">Importancia normal</option>
                <option value="high">Alta prioridad</option>
              </select>
              <button
                type="submit"
                disabled={!newMemoryText.trim()}
                className="liquid-glass-button liquid-glass-button-accent inline-flex min-h-[36px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold disabled:opacity-45"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Guardar recuerdo</span>
              </button>
            </div>
          </form>

          {/* Memories List */}
          <div className="mt-3 space-y-2">
            {memories.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-300/60 p-3 text-xs text-slate-500 dark:border-white/15 dark:text-slate-400">
                Aún no hay recuerdos guardados en esta conversación.
              </p>
            ) : (
              memories.map((mem) => (
                <div
                  key={mem.id}
                  className="rounded-xl border border-slate-300/50 bg-white/40 p-2.5 text-xs dark:border-white/12 dark:bg-slate-900/45"
                >
                  {editingId === mem.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value)}
                        rows={2}
                        className="w-full rounded-lg border border-sky-500/50 bg-white/80 p-2 text-xs text-slate-900 outline-none dark:bg-slate-900/80 dark:text-slate-100"
                      />
                      <div className="flex items-center justify-between gap-2">
                        <select
                          value={editImportance}
                          onChange={(e) =>
                            setEditImportance(e.target.value as 'high' | 'normal')
                          }
                          className="rounded-lg border border-slate-300/60 bg-white/60 px-2 py-1 text-[11px] dark:border-white/15 dark:bg-slate-900/60"
                        >
                          <option value="normal">Normal</option>
                          <option value="high">Alta</option>
                        </select>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setEditingId(null)}
                            className="rounded-lg px-2 py-1 text-[11px] hover:bg-black/10"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={() => saveEdit(mem.id)}
                            className="inline-flex items-center gap-1 rounded-lg bg-sky-600 px-2.5 py-1 text-[11px] font-medium text-white"
                          >
                            <Check className="h-3 w-3" />
                            <span>Guardar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="leading-relaxed text-slate-800 dark:text-slate-100">
                        {mem.content}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>
                          {mem.importance === 'high' ? 'Prioridad alta' : 'Normal'} ·{' '}
                          {mem.source === 'auto' ? 'Detectado' : 'Manual'}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => startEdit(mem)}
                            aria-label="Editar recuerdo"
                            className="rounded-lg p-1.5 hover:bg-slate-900/10 dark:hover:bg-white/10"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteMemory(mem.id)}
                            aria-label="Eliminar recuerdo"
                            className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>
        </section>

        {/* Pinned Messages */}
        <section>
          <h3 className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
            Mensajes fijados ({pinnedMessages.length})
          </h3>
          {pinnedMessages.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300/60 p-3 text-xs text-slate-500 dark:border-white/15 dark:text-slate-400">
              Usa el botón "Fijar" en cualquier mensaje del chat para mantenerlo siempre presente en esta sesión.
            </p>
          ) : (
            <div className="space-y-2">
              {pinnedMessages.map((pm) => (
                <div
                  key={pm.id}
                  className="rounded-xl border border-slate-300/50 bg-white/40 p-2.5 text-xs dark:border-white/12 dark:bg-slate-900/45"
                >
                  <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="inline-flex items-center gap-1 font-medium text-sky-600 dark:text-sky-400">
                      <Bookmark className="h-3 w-3" />
                      {pm.role === 'user' ? 'Usuario' : 'Asistente'}
                    </span>
                    <button
                      type="button"
                      onClick={() => onUnpinMessage(pm.id)}
                      className="text-[11px] hover:underline"
                    >
                      Desfijar
                    </button>
                  </div>
                  <p className="mt-1 line-clamp-3 text-slate-800 dark:text-slate-200">
                    {pm.content}
                  </p>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Progressive Contextual Summary */}
        <section>
          <div className="mb-2 flex items-center justify-between gap-2">
            <h3 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
              Resumen progresivo
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onRegenerateSummary}
                title="Actualizar resumen progresivo desde el historial"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-sky-600 hover:bg-sky-500/10 dark:text-sky-400"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Actualizar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSummaryDraft(conversation.summary);
                  setEditingSummary((v) => !v);
                }}
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium hover:bg-slate-900/10 dark:hover:bg-white/10"
              >
                <Edit3 className="h-3 w-3" />
                <span>{editingSummary ? 'Cerrar' : 'Editar'}</span>
              </button>
            </div>
          </div>

          {editingSummary ? (
            <div className="space-y-2">
              <textarea
                value={summaryDraft}
                onChange={(e) => setSummaryDraft(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-sky-500/50 bg-white/75 p-2.5 text-xs text-slate-900 outline-none dark:bg-slate-900/75 dark:text-slate-100"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onUpdateSummary(summaryDraft);
                    setEditingSummary(false);
                  }}
                  className="liquid-glass-button liquid-glass-button-accent rounded-xl px-3 py-1.5 text-xs font-medium"
                >
                  Guardar resumen
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-slate-300/50 bg-white/35 p-3 text-xs leading-relaxed text-slate-700 whitespace-pre-wrap dark:border-white/12 dark:bg-slate-900/40 dark:text-slate-300">
              {conversation.summary.trim() ||
                'Los resúmenes progresivos se generan automáticamente al superar los 18 mensajes o manualmente con "Actualizar".'}
            </div>
          )}
        </section>
      </div>
    </LiquidGlassSurface>
  );

  return (
    <div className="fixed inset-0 z-50 flex justify-end xl:static xl:inset-auto xl:z-auto xl:h-full xl:w-[340px] xl:shrink-0">
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs xl:hidden"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative z-10 h-full w-[90vw] max-w-[380px] p-2.5 xl:w-full xl:max-w-none xl:p-0">
        {content}
      </div>
    </div>
  );
};
