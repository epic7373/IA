import React, { useEffect, useRef, useState } from 'react';
import {
  Eraser,
  FileText,
  ImagePlus,
  Mic,
  MicOff,
  Paperclip,
  Send,
  Square,
  X,
} from 'lucide-react';
import type { ChatAttachment } from '../types/liquid';
import { LiquidGlassSurface } from './LiquidGlassSurface';

interface SpeechRecognitionInstance {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<{
    isFinal: boolean;
    0: { transcript: string };
  }>;
}

interface ComposerProps {
  input: string;
  onInputChange: (val: string) => void;
  attachments: ChatAttachment[];
  onAddAttachments: (files: FileList) => void;
  onRemoveAttachment: (id: string) => void;
  supportsVision: boolean;
  isStreaming: boolean;
  onSend: () => void;
  onStopGeneration: () => void;
}

export const Composer: React.FC<ComposerProps> = ({
  input,
  onInputChange,
  attachments,
  onAddAttachments,
  onRemoveAttachment,
  supportsVision,
  isStreaming,
  onSend,
  onStopGeneration,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const speechSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as unknown as Record<string, unknown>).SpeechRecognition ||
        (window as unknown as Record<string, unknown>).webkitSpeechRecognition
    );

  // Auto-resize textarea smoothly
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(180, Math.max(44, el.scrollHeight))}px`;
  }, [input]);

  // Cleanup active voice recording on unmount
  useEffect(() => {
    return () => {
      try {
        recognitionRef.current?.abort();
      } catch {
        // Ignore
      }
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isStreaming && (input.trim() || attachments.length > 0)) {
        onSend();
      }
    }
  };

  const startVoiceDictation = () => {
    setVoiceError(null);
    if (!speechSupported) {
      setVoiceError(
        'Tu navegador no admite Web Speech API para reconocimiento de voz (compatible con Chrome, Edge y navegadores Android basados en Chromium).'
      );
      return;
    }

    const win = window as unknown as Record<
      string,
      new () => SpeechRecognitionInstance
    >;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    try {
      const recognition = new SpeechRec();
      recognition.lang = 'es-ES';
      recognition.continuous = true;
      recognition.interimResults = true;

      const baseText = input.trim() ? `${input.trim()} ` : '';
      let finalAccum = '';

      recognition.onresult = (event: SpeechRecognitionEventLike) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res.isFinal) {
            finalAccum += `${res[0].transcript} `;
          } else {
            interim += res[0].transcript;
          }
        }
        setInterimTranscript(interim);
        onInputChange(`${baseText}${finalAccum}${interim}`.trimStart());
      };

      recognition.onerror = (ev: { error: string }) => {
        if (ev.error === 'not-allowed') {
          setVoiceError('Permiso de micrófono denegado por el navegador.');
        } else if (ev.error !== 'aborted') {
          setVoiceError(`No se pudo transcribir audio (${ev.error}).`);
        }
        setIsRecording(false);
        setInterimTranscript('');
      };

      recognition.onend = () => {
        setIsRecording(false);
        setInterimTranscript('');
      };

      recognitionRef.current = recognition;
      recognition.start();
      setIsRecording(true);
    } catch {
      setVoiceError('No fue posible iniciar el micrófono en este dispositivo.');
      setIsRecording(false);
    }
  };

  const stopVoiceDictation = () => {
    try {
      recognitionRef.current?.stop();
    } catch {
      // Ignore
    }
    setIsRecording(false);
    setInterimTranscript('');
  };

  const cancelVoiceDictation = () => {
    try {
      recognitionRef.current?.abort();
    } catch {
      // Ignore
    }
    setIsRecording(false);
    setInterimTranscript('');
  };

  const hasSendableContent = Boolean(input.trim() || attachments.length > 0);

  return (
    <div className="shrink-0 px-2 pb-2 pt-1 sm:px-6 sm:pb-4">
      <div className="mx-auto max-w-4xl">
        <LiquidGlassSurface
          variant="elevated"
          className="p-2.5 sm:p-3 text-slate-900 dark:text-slate-100"
        >
          {/* Voice Error / Unsupported Banner */}
          {voiceError && (
            <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-amber-500/35 bg-amber-500/12 px-3 py-2 text-xs text-amber-800 dark:text-amber-200">
              <span>{voiceError}</span>
              <button
                type="button"
                onClick={() => setVoiceError(null)}
                aria-label="Cerrar aviso de voz"
                className="rounded-lg p-1 hover:bg-black/10"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Active Voice Recording Bar */}
          {isRecording && (
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-500/35 bg-sky-500/12 px-3 py-2 text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500 animate-pulse" />
                <span className="font-medium">
                  Grabando voz... {interimTranscript ? `"${interimTranscript}"` : 'habla ahora y edita antes de enviar'}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={stopVoiceDictation}
                  className="liquid-glass-button rounded-lg px-2.5 py-1 text-xs font-medium"
                >
                  Finalizar
                </button>
                <button
                  type="button"
                  onClick={cancelVoiceDictation}
                  className="rounded-lg px-2.5 py-1 text-xs font-medium text-rose-600 hover:bg-rose-500/10 dark:text-rose-400"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Attachment Previews */}
          {attachments.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-2">
              {attachments.map((att) => (
                <div
                  key={att.id}
                  className="relative flex items-center gap-2 rounded-xl border border-slate-300/60 bg-white/45 p-1.5 pr-7 text-xs dark:border-white/15 dark:bg-slate-900/55"
                >
                  {att.kind === 'image' ? (
                    <img
                      src={att.dataUrl}
                      alt={att.name}
                      referrerPolicy="no-referrer"
                      className="h-12 w-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-500/15">
                      <FileText className="h-4 w-4" />
                    </div>
                  )}
                  <div className="max-w-[140px] truncate">
                    <div className="truncate font-medium">{att.name}</div>
                    <div className="text-[10px] opacity-70 tabular-nums">
                      {(att.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(att.id)}
                    aria-label={`Quitar archivo ${att.name}`}
                    className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/70 text-white hover:bg-slate-900"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Input Textarea */}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe un mensaje... (Enter envía, Shift+Enter salto de línea)"
              aria-label="Campo de mensaje"
              rows={1}
              className="liquid-scroll max-h-[180px] min-h-[44px] w-full resize-none bg-transparent px-2 py-2.5 text-[15px] leading-snug text-slate-900 placeholder:text-slate-500 outline-none dark:text-slate-100 dark:placeholder:text-slate-400"
            />
          </div>

          {/* Action Toolbar */}
          <div className="mt-1.5 flex items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-1.5">
              {/* Hidden file inputs */}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) onAddAttachments(e.target.files);
                  e.target.value = '';
                }}
              />
              <input
                ref={fileInputRef}
                type="file"
                accept=".txt,.md,.json,.csv,.ts,.tsx,.js,.py,.html,.css,.xml,.yaml,.yml"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) onAddAttachments(e.target.files);
                  e.target.value = '';
                }}
              />

              <button
                type="button"
                disabled={!supportsVision}
                onClick={() => imageInputRef.current?.click()}
                aria-label={
                  supportsVision
                    ? 'Adjuntar imagen'
                    : 'El modelo seleccionado no admite entrada visual'
                }
                title={
                  supportsVision
                    ? 'Adjuntar imagen'
                    : 'Entrada visual desactivada para este modelo'
                }
                className="liquid-glass-button inline-flex min-h-[44px] min-w-[44px] lg:min-h-[38px] lg:min-w-[38px] items-center justify-center rounded-xl disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ImagePlus className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Adjuntar archivo de texto o código"
                title="Adjuntar documento compatible (.txt, .md, .json, .csv, código)"
                className="liquid-glass-button inline-flex min-h-[44px] min-w-[44px] lg:min-h-[38px] lg:min-w-[38px] items-center justify-center rounded-xl"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={isRecording ? stopVoiceDictation : startVoiceDictation}
                aria-label={
                  isRecording ? 'Detener dictado por voz' : 'Entrada por voz'
                }
                title={
                  speechSupported
                    ? isRecording
                      ? 'Detener dictado'
                      : 'Dictado por voz'
                    : 'Web Speech API no disponible en este navegador'
                }
                className={`liquid-glass-button inline-flex min-h-[44px] min-w-[44px] lg:min-h-[38px] lg:min-w-[38px] items-center justify-center rounded-xl ${
                  isRecording ? 'ring-2 ring-rose-500 text-rose-500' : ''
                }`}
              >
                {isRecording ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>

              {input && (
                <button
                  type="button"
                  onClick={() => onInputChange('')}
                  aria-label="Limpiar texto"
                  title="Limpiar campo de escritura"
                  className="liquid-glass-button inline-flex min-h-[44px] min-w-[44px] lg:min-h-[38px] lg:min-w-[38px] items-center justify-center rounded-xl"
                >
                  <Eraser className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!supportsVision && (
                <span className="hidden sm:inline text-[11px] text-slate-500 dark:text-slate-400">
                  Sin visión en este modelo
                </span>
              )}

              {isStreaming ? (
                <button
                  type="button"
                  onClick={onStopGeneration}
                  aria-label="Detener generación"
                  className="liquid-glass-button inline-flex min-h-[44px] lg:min-h-[40px] items-center gap-2 rounded-xl bg-rose-600/90 px-4 py-2 text-xs font-semibold text-white whitespace-nowrap"
                >
                  <Square className="h-3.5 w-3.5 fill-current" />
                  <span>Detener</span>
                </button>
              ) : (
                <button
                  type="button"
                  disabled={!hasSendableContent}
                  onClick={onSend}
                  aria-label="Enviar mensaje"
                  className="liquid-glass-button liquid-glass-button-accent inline-flex min-h-[44px] lg:min-h-[40px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold whitespace-nowrap disabled:cursor-not-allowed disabled:opacity-45"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Enviar</span>
                </button>
              )}
            </div>
          </div>
        </LiquidGlassSurface>
      </div>
    </div>
  );
};
