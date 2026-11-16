import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  EyeOff,
  Loader2,
  Palette,
  PlugZap,
  Sliders,
  Upload,
  X,
} from 'lucide-react';
import { PROVIDER_PRESETS, testApiConnection } from '../core/apiClient';
import type {
  ApiConfig,
  BackgroundMode,
  FontFamilyOption,
  GeneralSettings,
  PerformanceMode,
  UiDensity,
} from '../types/liquid';
import { LiquidGlassSurface } from './LiquidGlassSurface';

interface SettingsModalProps {
  open: boolean;
  onClose: () => void;
  apiConfig: ApiConfig;
  onChangeApiConfig: (next: ApiConfig) => void;
  generalSettings: GeneralSettings;
  onChangeGeneralSettings: (next: GeneralSettings) => void;
  onExportBackup: () => void;
  onImportBackup: (file: File) => Promise<void>;
}

type SettingsTab = 'api' | 'generation' | 'appearance' | 'data';

const ACCENT_SWATCHES = [
  '#0ea5e9',
  '#2563eb',
  '#059669',
  '#d97706',
  '#e11d48',
  '#64748b',
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  open,
  onClose,
  apiConfig,
  onChangeApiConfig,
  generalSettings,
  onChangeGeneralSettings,
  onExportBackup,
  onImportBackup,
}) => {
  const [tab, setTab] = useState<SettingsTab>('api');
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);
  const [importStatus, setImportStatus] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  if (!open) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    const res = await testApiConnection(apiConfig);
    setTestResult({ ok: res.ok, message: res.message });
    setTesting(false);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onChangeGeneralSettings({
          ...generalSettings,
          backgroundMode: 'custom-image',
          customBackgroundDataUrl: reader.result,
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await onImportBackup(file);
      setImportStatus({
        ok: true,
        message: 'Respaldo importado y guardado en IndexedDB correctamente.',
      });
    } catch (err) {
      setImportStatus({
        ok: false,
        message: (err as Error)?.message || 'Error al importar el archivo JSON.',
      });
    }
    e.target.value = '';
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Configuración"
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
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-slate-300/40 pb-3.5 dark:border-white/10">
          <div>
            <h2 className="text-lg font-bold tracking-tight">Configuración</h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Conexión OpenAI compatible, parámetros de generación, apariencia y respaldo local
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar configuración"
            className="liquid-glass-button inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-3 flex flex-wrap gap-1.5 border-b border-slate-300/40 pb-3 dark:border-white/10">
          {(
            [
              { id: 'api', label: 'Conexión API', icon: PlugZap },
              { id: 'generation', label: 'Generación', icon: Sliders },
              { id: 'appearance', label: 'Apariencia y Rendimiento', icon: Palette },
              { id: 'data', label: 'Datos y Respaldo', icon: Download },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`liquid-glass-button inline-flex min-h-[40px] items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap ${
                  active ? 'liquid-glass-button-accent' : ''
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="liquid-scroll mt-4 flex-1 space-y-4 overflow-y-auto pr-1">
          {tab === 'api' && (
            <div className="space-y-4">
              {/* Browser Storage Security Notice */}
              <div className="flex items-start gap-2.5 rounded-2xl border border-amber-500/35 bg-amber-500/10 p-3.5 text-xs text-slate-800 dark:text-slate-200">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                <div>
                  <strong>Aviso de seguridad personal:</strong> Tu API Key se guarda únicamente en el{' '}
                  <code>localStorage</code> de este navegador para uso personal. El almacenamiento local del navegador no ofrece cifrado criptográfico fuerte frente a extensiones maliciosas o acceso físico al equipo.
                </div>
              </div>

              {/* Provider Presets */}
              <div>
                <div className="mb-2 text-xs font-semibold">
                  Plantillas de proveedores compatibles con OpenAI
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {PROVIDER_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        onChangeApiConfig({
                          ...apiConfig,
                          baseUrl: p.baseUrl,
                          chatEndpoint: p.chatEndpoint,
                          modelId: p.suggestedModel,
                          supportsVision: p.supportsVision,
                          supportsFrequencyPenalty: p.supportsFrequencyPenalty,
                        })
                      }
                      className="liquid-glass-button rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="api-base-url" className="block text-xs font-semibold mb-1.5">
                    API Base URL
                  </label>
                  <input
                    id="api-base-url"
                    type="url"
                    value={apiConfig.baseUrl}
                    onChange={(e) =>
                      onChangeApiConfig({ ...apiConfig, baseUrl: e.target.value })
                    }
                    placeholder="https://api.openai.com/v1"
                    className="w-full min-h-[42px] rounded-xl border border-slate-300/60 bg-white/55 px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/15 dark:bg-slate-900/55"
                  />
                </div>
                <div>
                  <label htmlFor="api-endpoint" className="block text-xs font-semibold mb-1.5">
                    Endpoint de chat
                  </label>
                  <input
                    id="api-endpoint"
                    type="text"
                    value={apiConfig.chatEndpoint}
                    onChange={(e) =>
                      onChangeApiConfig({
                        ...apiConfig,
                        chatEndpoint: e.target.value,
                      })
                    }
                    placeholder="/chat/completions"
                    className="w-full min-h-[42px] rounded-xl border border-slate-300/60 bg-white/55 px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/15 dark:bg-slate-900/55"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="api-key" className="block text-xs font-semibold mb-1.5">
                    API Key
                  </label>
                  <div className="relative">
                    <input
                      id="api-key"
                      type={showKey ? 'text' : 'password'}
                      value={apiConfig.apiKey}
                      onChange={(e) =>
                        onChangeApiConfig({ ...apiConfig, apiKey: e.target.value })
                      }
                      placeholder="sk-..."
                      autoComplete="off"
                      className="w-full min-h-[42px] rounded-xl border border-slate-300/60 bg-white/55 py-2 pl-3 pr-10 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/15 dark:bg-slate-900/55"
                    />
                    <button
                      type="button"
                      onClick={() => setShowKey((v) => !v)}
                      aria-label={showKey ? 'Ocultar API Key' : 'Mostrar API Key'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 opacity-70 hover:opacity-100"
                    >
                      {showKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label htmlFor="api-model" className="block text-xs font-semibold mb-1.5">
                    Model ID predeterminado
                  </label>
                  <input
                    id="api-model"
                    type="text"
                    value={apiConfig.modelId}
                    onChange={(e) =>
                      onChangeApiConfig({ ...apiConfig, modelId: e.target.value })
                    }
                    placeholder="gpt-4o-mini"
                    className="w-full min-h-[42px] rounded-xl border border-slate-300/60 bg-white/55 px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/15 dark:bg-slate-900/55"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="global-system" className="block text-xs font-semibold mb-1.5">
                  System Prompt global opcional
                </label>
                <textarea
                  id="global-system"
                  rows={2}
                  value={apiConfig.globalSystemPrompt}
                  onChange={(e) =>
                    onChangeApiConfig({
                      ...apiConfig,
                      globalSystemPrompt: e.target.value,
                    })
                  }
                  placeholder="Instrucciones base aplicadas junto al System Prompt de cada bot..."
                  className="w-full rounded-xl border border-slate-300/60 bg-white/55 p-3 text-xs outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/15 dark:bg-slate-900/55"
                />
              </div>

              <div className="grid gap-3 rounded-2xl border border-slate-300/50 bg-white/35 p-3.5 dark:border-white/12 dark:bg-slate-900/40 sm:grid-cols-2">
                <label className="flex items-center justify-between gap-2 text-xs font-medium cursor-pointer">
                  <span>Habilitar Streaming SSE</span>
                  <input
                    type="checkbox"
                    checked={apiConfig.supportsStreaming}
                    onChange={(e) =>
                      onChangeApiConfig({
                        ...apiConfig,
                        supportsStreaming: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-sky-500"
                  />
                </label>
                <label className="flex items-center justify-between gap-2 text-xs font-medium cursor-pointer">
                  <span>El modelo admite entrada visual (imágenes)</span>
                  <input
                    type="checkbox"
                    checked={apiConfig.supportsVision}
                    onChange={(e) =>
                      onChangeApiConfig({
                        ...apiConfig,
                        supportsVision: e.target.checked,
                      })
                    }
                    className="h-4 w-4 accent-sky-500"
                  />
                </label>
              </div>

              {/* Real API Connection Test */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <button
                  type="button"
                  disabled={testing}
                  onClick={handleTestConnection}
                  className="liquid-glass-button liquid-glass-button-accent inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
                >
                  {testing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <PlugZap className="h-4 w-4" />
                  )}
                  <span>{testing ? 'Probando conexión...' : 'Probar conexión'}</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`flex items-start gap-2 rounded-xl border p-3 text-xs ${
                    testResult.ok
                      ? 'border-emerald-500/40 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200'
                      : 'border-rose-500/40 bg-rose-500/12 text-rose-800 dark:text-rose-200'
                  }`}
                >
                  {testResult.ok ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}

          {tab === 'generation' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-slate-300/50 bg-white/35 p-3.5 dark:border-white/12 dark:bg-slate-900/40">
                  <div className="flex justify-between text-xs font-semibold">
                    <label htmlFor="gen-temp">Temperature</label>
                    <span className="font-mono tabular-nums">{apiConfig.temperature}</span>
                  </div>
                  <input
                    id="gen-temp"
                    type="range"
                    min={0}
                    max={2}
                    step={0.05}
                    value={apiConfig.temperature}
                    onChange={(e) =>
                      onChangeApiConfig({
                        ...apiConfig,
                        temperature: Number(e.target.value),
                      })
                    }
                    className="liquid-slider mt-3 w-full"
                  />
                </div>

                <div className="rounded-xl border border-slate-300/50 bg-white/35 p-3.5 dark:border-white/12 dark:bg-slate-900/40">
                  <div className="flex justify-between text-xs font-semibold">
                    <label htmlFor="gen-top-p">Top P</label>
                    <span className="font-mono tabular-nums">{apiConfig.topP}</span>
                  </div>
                  <input
                    id="gen-top-p"
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={apiConfig.topP}
                    onChange={(e) =>
                      onChangeApiConfig({
                        ...apiConfig,
                        topP: Number(e.target.value),
                      })
                    }
                    className="liquid-slider mt-3 w-full"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="gen-max-tokens" className="block text-xs font-semibold mb-1.5">
                    Max Tokens
                  </label>
                  <input
                    id="gen-max-tokens"
                    type="number"
                    min={64}
                    max={65536}
                    value={apiConfig.maxTokens}
                    onChange={(e) =>
                      onChangeApiConfig({
                        ...apiConfig,
                        maxTokens: Number(e.target.value) || 2048,
                      })
                    }
                    className="w-full min-h-[42px] rounded-xl border border-slate-300/60 bg-white/55 px-3 py-2 font-mono text-xs dark:border-white/15 dark:bg-slate-900/55"
                  />
                </div>

                <div className="rounded-xl border border-slate-300/50 bg-white/35 p-3.5 dark:border-white/12 dark:bg-slate-900/40">
                  <div className="flex items-center justify-between gap-2 text-xs font-semibold">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={apiConfig.supportsFrequencyPenalty}
                        onChange={(e) =>
                          onChangeApiConfig({
                            ...apiConfig,
                            supportsFrequencyPenalty: e.target.checked,
                          })
                        }
                        className="h-4 w-4 accent-sky-500"
                      />
                      <span>Enviar Frequency Penalty</span>
                    </label>
                    <span className="font-mono tabular-nums">
                      {apiConfig.frequencyPenalty}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={-2}
                    max={2}
                    step={0.1}
                    disabled={!apiConfig.supportsFrequencyPenalty}
                    value={apiConfig.frequencyPenalty}
                    onChange={(e) =>
                      onChangeApiConfig({
                        ...apiConfig,
                        frequencyPenalty: Number(e.target.value),
                      })
                    }
                    className="liquid-slider mt-3 w-full disabled:opacity-40"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="custom-params-json" className="block text-xs font-semibold mb-1.5">
                  Parámetros adicionales JSON (opcional)
                </label>
                <textarea
                  id="custom-params-json"
                  rows={3}
                  value={apiConfig.customParamsJson}
                  onChange={(e) =>
                    onChangeApiConfig({
                      ...apiConfig,
                      customParamsJson: e.target.value,
                    })
                  }
                  placeholder='{"presence_penalty": 0.2}'
                  className="w-full rounded-xl border border-slate-300/60 bg-white/55 p-3 font-mono text-xs outline-none focus-visible:ring-2 focus-visible:ring-sky-500 dark:border-white/15 dark:bg-slate-900/55"
                />
              </div>
            </div>
          )}

          {tab === 'appearance' && (
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Theme */}
                <div>
                  <div className="text-xs font-semibold mb-2">Tema de interfaz</div>
                  <div className="grid grid-cols-2 gap-2">
                    {(['light', 'dark'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() =>
                          onChangeGeneralSettings({ ...generalSettings, theme: t })
                        }
                        className={`liquid-glass-button min-h-[42px] rounded-xl text-xs font-semibold ${
                          generalSettings.theme === t
                            ? 'ring-2 ring-sky-500'
                            : ''
                        }`}
                      >
                        {t === 'light' ? 'Tema claro' : 'Tema oscuro'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Accent Color */}
                <div>
                  <div className="text-xs font-semibold mb-2">Color de acento</div>
                  <div className="flex flex-wrap items-center gap-2">
                    {ACCENT_SWATCHES.map((hex) => (
                      <button
                        key={hex}
                        type="button"
                        onClick={() =>
                          onChangeGeneralSettings({
                            ...generalSettings,
                            accentColor: hex,
                          })
                        }
                        aria-label={`Color de acento ${hex}`}
                        className={`h-8 w-8 rounded-full border-2 transition-transform hover:scale-110 ${
                          generalSettings.accentColor === hex
                            ? 'border-white ring-2 ring-slate-900 dark:ring-white'
                            : 'border-transparent'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                    <input
                      type="color"
                      aria-label="Selector de color de acento personalizado"
                      value={generalSettings.accentColor}
                      onChange={(e) =>
                        onChangeGeneralSettings({
                          ...generalSettings,
                          accentColor: e.target.value,
                        })
                      }
                      className="h-8 w-10 cursor-pointer rounded-lg border-0 bg-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Background & Custom Wallpaper */}
              <div className="rounded-2xl border border-slate-300/50 bg-white/35 p-3.5 dark:border-white/12 dark:bg-slate-900/40">
                <div className="text-xs font-semibold mb-2">Fondo del espacio de trabajo</div>
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      { id: 'optical-waves', label: 'Ondas Ópticas' },
                      { id: 'liquid-shader', label: 'Shader WebGL Cáustico' },
                      { id: 'studio-slate', label: 'Gradiente Neutro' },
                      { id: 'custom-image', label: 'Imagen Personalizada' },
                    ] as { id: BackgroundMode; label: string }[]
                  ).map((bg) => (
                    <button
                      key={bg.id}
                      type="button"
                      onClick={() =>
                        onChangeGeneralSettings({
                          ...generalSettings,
                          backgroundMode: bg.id,
                        })
                      }
                      className={`liquid-glass-button rounded-xl px-3 py-2 text-xs font-medium ${
                        generalSettings.backgroundMode === bg.id
                          ? 'ring-2 ring-sky-500'
                          : ''
                      }`}
                    >
                      {bg.label}
                    </button>
                  ))}

                  <label className="liquid-glass-button inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium">
                    <Upload className="h-3.5 w-3.5" />
                    <span>Subir fondo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBgUpload}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Typography, Font Size, Density */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="font-family-select" className="block text-xs font-semibold mb-1.5">
                    Tipografía
                  </label>
                  <select
                    id="font-family-select"
                    value={generalSettings.fontFamily}
                    onChange={(e) =>
                      onChangeGeneralSettings({
                        ...generalSettings,
                        fontFamily: e.target.value as FontFamilyOption,
                      })
                    }
                    className="w-full min-h-[42px] rounded-xl border border-slate-300/60 bg-white/55 px-3 py-2 text-xs dark:border-white/15 dark:bg-slate-900/55"
                  >
                    <option value="plus-jakarta">Plus Jakarta Sans</option>
                    <option value="dm-sans">DM Sans</option>
                    <option value="manrope">Manrope</option>
                    <option value="system">Sistema nativo</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="font-size-range" className="block text-xs font-semibold mb-1.5">
                    Tamaño de fuente ({generalSettings.fontSize}px)
                  </label>
                  <input
                    id="font-size-range"
                    type="range"
                    min={13}
                    max={18}
                    step={1}
                    value={generalSettings.fontSize}
                    onChange={(e) =>
                      onChangeGeneralSettings({
                        ...generalSettings,
                        fontSize: Number(e.target.value),
                      })
                    }
                    className="liquid-slider mt-3 w-full"
                  />
                </div>

                <div>
                  <label htmlFor="density-select" className="block text-xs font-semibold mb-1.5">
                    Densidad visual
                  </label>
                  <select
                    id="density-select"
                    value={generalSettings.density}
                    onChange={(e) =>
                      onChangeGeneralSettings({
                        ...generalSettings,
                        density: e.target.value as UiDensity,
                      })
                    }
                    className="w-full min-h-[42px] rounded-xl border border-slate-300/60 bg-white/55 px-3 py-2 text-xs dark:border-white/15 dark:bg-slate-900/55"
                  >
                    <option value="compact">Compacta</option>
                    <option value="comfortable">Equilibrada</option>
                    <option value="airy">Espaciada</option>
                  </select>
                </div>
              </div>

              {/* Performance Mode */}
              <div>
                <label htmlFor="perf-mode" className="block text-xs font-semibold mb-1.5">
                  Modo de rendimiento gráfico
                </label>
                <select
                  id="perf-mode"
                  value={generalSettings.performanceMode}
                  onChange={(e) =>
                    onChangeGeneralSettings({
                      ...generalSettings,
                      performanceMode: e.target.value as PerformanceMode,
                    })
                  }
                  className="w-full min-h-[42px] rounded-xl border border-slate-300/60 bg-white/55 px-3 py-2 text-xs dark:border-white/15 dark:bg-slate-900/55"
                >
                  <option value="auto">
                    Automático (respeta prefers-reduced-motion y hardware limitado)
                  </option>
                  <option value="high">
                    Máxima calidad óptica (refracción SVG + shaders completos)
                  </option>
                  <option value="reduced">
                    Reducir efectos visuales (máxima fluidez y ahorro de batería)
                  </option>
                </select>
              </div>
            </div>
          )}

          {tab === 'data' && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-300/50 bg-white/35 p-4 dark:border-white/12 dark:bg-slate-900/40">
                <h3 className="text-sm font-semibold">
                  Exportar e importar respaldo JSON
                </h3>
                <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
                  Incluye bots, conversaciones, historial completo, recuerdos aislados, ajustes de Glass Engine y preferencias visuales (no exporta tu API Key por seguridad).
                </p>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={onExportBackup}
                    className="liquid-glass-button liquid-glass-button-accent inline-flex min-h-[42px] items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold"
                  >
                    <Download className="h-4 w-4" />
                    <span>Exportar todo (.json)</span>
                  </button>

                  <label className="liquid-glass-button inline-flex min-h-[42px] cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold">
                    <Upload className="h-4 w-4" />
                    <span>Importar respaldo (.json)</span>
                    <input
                      type="file"
                      accept="application/json,.json"
                      onChange={handleImportFile}
                      className="hidden"
                    />
                  </label>
                </div>

                {importStatus && (
                  <div
                    className={`mt-3 rounded-xl border p-3 text-xs ${
                      importStatus.ok
                        ? 'border-emerald-500/40 bg-emerald-500/12 text-emerald-800 dark:text-emerald-200'
                        : 'border-rose-500/40 bg-rose-500/12 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    {importStatus.message}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </LiquidGlassSurface>
    </div>
  );
};
