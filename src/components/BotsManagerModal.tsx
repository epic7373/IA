import React, { useState } from 'react';
import {
  Bot as BotIcon,
  Check,
  Copy,
  Edit3,
  Plus,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { AVATAR_GALLERY } from '../core/seedData';
import type { Bot } from '../types/liquid';
import { LiquidGlassSurface } from './LiquidGlassSurface';

interface BotsManagerModalProps {
  open: boolean;
  onClose: () => void;
  bots: Bot[];
  activeBotId: string;
  onSelectBotAndStartChat: (botId: string) => void;
  onSaveBot: (bot: Bot) => void;
  onDuplicateBot: (botId: string) => void;
  onDeleteBot: (botId: string) => void;
}

const emptyBotDraft = (): Bot => {
  const now = Date.now();
  return {
    id: `bot_${now}`,
    name: '',
    description: '',
    avatar: AVATAR_GALLERY[0].url,
    systemPrompt: '',
    greeting: '',
    modelId: '',
    supportsVision: true,
    useCustomParams: false,
    temperature: 0.7,
    topP: 0.95,
    maxTokens: 2048,
    createdAt: now,
    updatedAt: now,
  };
};

export const BotsManagerModal: React.FC<BotsManagerModalProps> = ({
  open,
  onClose,
  bots,
  activeBotId,
  onSelectBotAndStartChat,
  onSaveBot,
  onDuplicateBot,
  onDeleteBot,
}) => {
  const [editingBot, setEditingBot] = useState<Bot | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  if (!open) return null;

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingBot) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditingBot({ ...editingBot, avatar: reader.result });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBot) return;
    if (!editingBot.name.trim()) {
      setFormError('El nombre del bot es obligatorio.');
      return;
    }
    if (!editingBot.systemPrompt.trim()) {
      setFormError('Define un System Prompt para la identidad del bot.');
      return;
    }
    setFormError(null);
    onSaveBot({
      ...editingBot,
      name: editingBot.name.trim(),
      description: editingBot.description.trim(),
      systemPrompt: editingBot.systemPrompt.trim(),
      greeting: editingBot.greeting.trim(),
      modelId: editingBot.modelId.trim(),
      updatedAt: Date.now(),
    });
    setEditingBot(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Gestor de Bots"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6"
    >
      <div
        className="fixed inset-0 bg-slate-950/55 backdrop-blur-xs"
        onClick={onClose}
        aria-hidden="true"
      />

      <LiquidGlassSurface
        variant="elevated"
        className="relative z-10 flex max-h-[92dvh] w-full max-w-4xl flex-col overflow-hidden p-4 sm:p-6 text-slate-900 dark:text-slate-100"
      >
        <div className="flex items-center justify-between gap-3 border-b border-slate-300/40 pb-3.5 dark:border-white/10">
          <div className="flex items-center gap-2.5">
            <BotIcon className="h-5 w-5 text-sky-500" />
            <div>
              <h2 className="text-lg font-bold tracking-tight">
                {editingBot ? 'Editor de Bot' : 'Bots personalizados'}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Cada bot conserva su identidad y System Prompt propio, con memoria aislada por chat
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!editingBot && (
              <button
                type="button"
                onClick={() => {
                  setFormError(null);
                  setEditingBot(emptyBotDraft());
                }}
                className="liquid-glass-button liquid-glass-button-accent inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Crear bot</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar gestor de bots"
              className="liquid-glass-button inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="liquid-scroll mt-4 flex-1 overflow-y-auto pr-1">
          {editingBot ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="rounded-xl border border-rose-500/40 bg-rose-500/12 p-3 text-xs text-rose-700 dark:text-rose-300">
                  {formError}
                </div>
              )}

              {/* Avatar Selection */}
              <div className="rounded-2xl border border-slate-300/50 bg-white/35 p-4 dark:border-white/12 dark:bg-slate-900/40">
                <div className="text-xs font-semibold mb-2.5">Avatar del bot</div>
                <div className="flex flex-wrap items-center gap-3">
                  <img
                    src={editingBot.avatar}
                    alt="Avatar seleccionado"
                    referrerPolicy="no-referrer"
                    className="h-14 w-14 rounded-2xl object-cover ring-2 ring-sky-500/60"
                  />
                  <div className="flex flex-wrap gap-2">
                    {AVATAR_GALLERY.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() =>
                          setEditingBot({ ...editingBot, avatar: item.url })
                        }
                        title={item.label}
                        className={`overflow-hidden rounded-xl p-0.5 transition-transform hover:scale-105 ${
                          editingBot.avatar === item.url
                            ? 'ring-2 ring-sky-500'
                            : 'opacity-80'
                        }`}
                      >
                        <img
                          src={item.url}
                          alt={item.label}
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 rounded-lg object-cover"
                        />
                      </button>
                    ))}
                    <label className="liquid-glass-button inline-flex min-h-[40px] cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium">
                      <Upload className="h-3.5 w-3.5" />
                      <span>Subir imagen</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="bot-name" className="block text-xs font-semibold mb-1.5">
                    Nombre del bot
                  </label>
                  <input
                    id="bot-name"
                    type="text"
                    value={editingBot.name}
                    onChange={(e) =>
                      setEditingBot({ ...editingBot, name: e.target.value })
                    }
                    placeholder="Ej. Nova · Analista de Datos"
                    className="w-full min-h-[42px] rounded-xl border border-slate-300/60 bg-white/55 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/15 dark:bg-slate-900/55"
                  />
                </div>
                <div>
                  <label htmlFor="bot-model" className="block text-xs font-semibold mb-1.5">
                    Model ID específico (opcional)
                  </label>
                  <input
                    id="bot-model"
                    type="text"
                    value={editingBot.modelId}
                    onChange={(e) =>
                      setEditingBot({ ...editingBot, modelId: e.target.value })
                    }
                    placeholder="Vacío = usa el modelo global"
                    className="w-full min-h-[42px] rounded-xl border border-slate-300/60 bg-white/55 px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/15 dark:bg-slate-900/55"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bot-desc" className="block text-xs font-semibold mb-1.5">
                  Descripción breve
                </label>
                <input
                  id="bot-desc"
                  type="text"
                  value={editingBot.description}
                  onChange={(e) =>
                    setEditingBot({ ...editingBot, description: e.target.value })
                  }
                  placeholder="Describe su especialidad y estilo..."
                  className="w-full min-h-[42px] rounded-xl border border-slate-300/60 bg-white/55 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/15 dark:bg-slate-900/55"
                />
              </div>

              <div>
                <label htmlFor="bot-system" className="block text-xs font-semibold mb-1.5">
                  System Prompt (Personalidad e instrucciones permanentes)
                </label>
                <textarea
                  id="bot-system"
                  rows={4}
                  value={editingBot.systemPrompt}
                  onChange={(e) =>
                    setEditingBot({ ...editingBot, systemPrompt: e.target.value })
                  }
                  placeholder="Define quién es este bot, su tono, reglas y formato de respuesta..."
                  className="w-full rounded-xl border border-slate-300/60 bg-white/55 p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/15 dark:bg-slate-900/55"
                />
              </div>

              <div>
                <label htmlFor="bot-greeting" className="block text-xs font-semibold mb-1.5">
                  Mensaje de bienvenida
                </label>
                <textarea
                  id="bot-greeting"
                  rows={2}
                  value={editingBot.greeting}
                  onChange={(e) =>
                    setEditingBot({ ...editingBot, greeting: e.target.value })
                  }
                  placeholder="Mensaje inicial al abrir un nuevo chat con este bot..."
                  className="w-full rounded-xl border border-slate-300/60 bg-white/55 p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/15 dark:bg-slate-900/55"
                />
              </div>

              {/* Capabilities & Custom Generation Params */}
              <div className="grid gap-4 rounded-2xl border border-slate-300/50 bg-white/35 p-4 dark:border-white/12 dark:bg-slate-900/40 sm:grid-cols-2">
                <label className="flex items-center justify-between gap-3 text-xs font-medium cursor-pointer">
                  <span>Admite entrada de imágenes (Visión)</span>
                  <input
                    type="checkbox"
                    checked={editingBot.supportsVision}
                    onChange={(e) =>
                      setEditingBot({
                        ...editingBot,
                        supportsVision: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-sky-500"
                  />
                </label>

                <label className="flex items-center justify-between gap-3 text-xs font-medium cursor-pointer">
                  <span>Usar parámetros de generación propios</span>
                  <input
                    type="checkbox"
                    checked={editingBot.useCustomParams}
                    onChange={(e) =>
                      setEditingBot({
                        ...editingBot,
                        useCustomParams: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-sky-500"
                  />
                </label>

                {editingBot.useCustomParams && (
                  <div className="sm:col-span-2 grid gap-3 border-t border-slate-300/40 pt-3 dark:border-white/10 sm:grid-cols-3">
                    <div>
                      <label className="block text-[11px] font-medium mb-1">
                        Temperature ({editingBot.temperature})
                      </label>
                      <input
                        type="range"
                        min={0}
                        max={2}
                        step={0.05}
                        value={editingBot.temperature}
                        onChange={(e) =>
                          setEditingBot({
                            ...editingBot,
                            temperature: Number(e.target.value),
                          })
                        }
                        className="liquid-slider w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">
                        Top P ({editingBot.topP})
                      </label>
                      <input
                        type="range"
                        min={0.05}
                        max={1}
                        step={0.05}
                        value={editingBot.topP}
                        onChange={(e) =>
                          setEditingBot({
                            ...editingBot,
                            topP: Number(e.target.value),
                          })
                        }
                        className="liquid-slider w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium mb-1">
                        Max Tokens
                      </label>
                      <input
                        type="number"
                        min={64}
                        max={32768}
                        value={editingBot.maxTokens}
                        onChange={(e) =>
                          setEditingBot({
                            ...editingBot,
                            maxTokens: Number(e.target.value) || 2048,
                          })
                        }
                        className="w-full rounded-xl border border-slate-300/60 bg-white/55 px-2.5 py-1.5 font-mono text-xs dark:border-white/15 dark:bg-slate-900/55"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingBot(null)}
                  className="liquid-glass-button min-h-[42px] rounded-xl px-4 py-2 text-xs font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="liquid-glass-button liquid-glass-button-accent inline-flex min-h-[42px] items-center gap-1.5 rounded-xl px-5 py-2 text-xs font-semibold"
                >
                  <Check className="h-4 w-4" />
                  <span>Guardar bot</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="grid gap-3.5 sm:grid-cols-2">
              {bots.map((bot) => {
                const isSelected = bot.id === activeBotId;
                const isConfirmDelete = confirmDeleteId === bot.id;

                return (
                  <div
                    key={bot.id}
                    className={`flex flex-col justify-between rounded-2xl border p-4 transition-colors ${
                      isSelected
                        ? 'border-sky-500/55 bg-sky-500/10'
                        : 'border-slate-300/50 bg-white/35 dark:border-white/12 dark:bg-slate-900/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start gap-3">
                        <img
                          src={bot.avatar}
                          alt={bot.name}
                          referrerPolicy="no-referrer"
                          className="h-12 w-12 shrink-0 rounded-2xl object-cover ring-1 ring-white/35"
                        />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-sm font-bold">{bot.name}</h3>
                          <p className="mt-0.5 line-clamp-2 text-xs text-slate-600 dark:text-slate-300">
                            {bot.description || 'Sin descripción'}
                          </p>
                        </div>
                      </div>

                      <div className="mt-3 line-clamp-2 rounded-xl bg-slate-950/5 p-2.5 text-[11px] text-slate-600 dark:bg-slate-950/50 dark:text-slate-300">
                        {bot.systemPrompt}
                      </div>
                    </div>

                    {isConfirmDelete ? (
                      <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-rose-500/12 p-2 text-xs">
                        <span className="font-medium text-rose-600 dark:text-rose-400">
                          ¿Eliminar bot?
                        </span>
                        <div className="flex gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onDeleteBot(bot.id);
                              setConfirmDeleteId(null);
                            }}
                            className="rounded-lg bg-rose-600 px-2.5 py-1 font-medium text-white"
                          >
                            Eliminar
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="rounded-lg px-2 py-1"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3.5 flex items-center justify-between gap-2 border-t border-slate-300/40 pt-3 dark:border-white/10">
                        <button
                          type="button"
                          onClick={() => {
                            onSelectBotAndStartChat(bot.id);
                            onClose();
                          }}
                          className="liquid-glass-button liquid-glass-button-accent rounded-xl px-3.5 py-1.5 text-xs font-semibold"
                        >
                          Chatear ahora
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setFormError(null);
                              setEditingBot({ ...bot });
                            }}
                            aria-label={`Editar ${bot.name}`}
                            title="Editar bot"
                            className="liquid-glass-button inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-xl"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicateBot(bot.id)}
                            aria-label={`Duplicar ${bot.name}`}
                            title="Duplicar bot"
                            className="liquid-glass-button inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-xl"
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                          {bots.length > 1 && (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(bot.id)}
                              aria-label={`Eliminar ${bot.name}`}
                              title="Eliminar bot"
                              className="liquid-glass-button inline-flex min-h-[36px] min-w-[36px] items-center justify-center rounded-xl text-rose-600 dark:text-rose-400"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </LiquidGlassSurface>
    </div>
  );
};
