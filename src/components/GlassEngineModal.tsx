import React from 'react';
import { RotateCcw, Sparkles, X } from 'lucide-react';
import {
  DEFAULT_GLASS_CONFIG,
  GLASS_PRESETS,
  getPresetConfig,
} from '../glass/glassEngine';
import type { GlassConfig, GlassEffectsEnabled } from '../types/liquid';
import { LiquidGlassSurface } from './LiquidGlassSurface';

interface GlassEngineModalProps {
  open: boolean;
  onClose: () => void;
  config: GlassConfig;
  onChange: (next: GlassConfig) => void;
}

interface SliderSpec {
  key: keyof Omit<GlassConfig, 'presetId' | 'enabled'>;
  label: string;
  min: number;
  max: number;
  unit: string;
  toggleKey?: keyof GlassEffectsEnabled;
}

const SLIDERS: SliderSpec[] = [
  {
    key: 'refractionIntensity',
    label: 'Intensidad de refracción',
    min: 0,
    max: 100,
    unit: '%',
    toggleKey: 'refraction',
  },
  {
    key: 'blurIntensity',
    label: 'Intensidad de desenfoque',
    min: 0,
    max: 48,
    unit: 'px',
    toggleKey: 'blur',
  },
  {
    key: 'chromaticAberration',
    label: 'Aberración cromática',
    min: 0,
    max: 100,
    unit: '%',
    toggleKey: 'chromaticAberration',
  },
  {
    key: 'specularIntensity',
    label: 'Reflejos especulares',
    min: 0,
    max: 100,
    unit: '%',
    toggleKey: 'specular',
  },
  {
    key: 'transparency',
    label: 'Opacidad del vidrio',
    min: 12,
    max: 92,
    unit: '%',
  },
  {
    key: 'borderGlow',
    label: 'Intensidad de bordes luminosos',
    min: 0,
    max: 100,
    unit: '%',
    toggleKey: 'borderGlow',
  },
  {
    key: 'glassDepth',
    label: 'Profundidad del vidrio',
    min: 0,
    max: 100,
    unit: '%',
  },
  {
    key: 'shadowIntensity',
    label: 'Intensidad de las sombras',
    min: 0,
    max: 100,
    unit: '%',
    toggleKey: 'shadows',
  },
  {
    key: 'animationSpeed',
    label: 'Velocidad de las animaciones',
    min: 25,
    max: 200,
    unit: '%',
    toggleKey: 'animations',
  },
  {
    key: 'lightingIntensity',
    label: 'Intensidad de iluminación',
    min: 0,
    max: 100,
    unit: '%',
    toggleKey: 'lighting',
  },
];

export const GlassEngineModal: React.FC<GlassEngineModalProps> = ({
  open,
  onClose,
  config,
  onChange,
}) => {
  if (!open) return null;

  const updateField = (
    key: keyof Omit<GlassConfig, 'presetId' | 'enabled'>,
    value: number
  ) => {
    onChange({
      ...config,
      presetId: 'custom',
      [key]: value,
    });
  };

  const toggleEffect = (key: keyof GlassEffectsEnabled) => {
    onChange({
      ...config,
      presetId: 'custom',
      enabled: {
        ...config.enabled,
        [key]: !config.enabled[key],
      },
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Glass Engine"
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
          <div className="flex items-center gap-2.5">
            <Sparkles className="h-5 w-5 text-sky-500" />
            <div>
              <h2 className="text-lg font-bold tracking-tight">Glass Engine</h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Motor óptico en tiempo real · Todos los cambios se guardan automáticamente
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChange(DEFAULT_GLASS_CONFIG)}
              className="liquid-glass-button inline-flex min-h-[40px] items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Restablecer</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar Glass Engine"
              className="liquid-glass-button inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-xl"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="liquid-scroll mt-4 grid flex-1 gap-6 overflow-y-auto pr-1 lg:grid-cols-[1.05fr_1.2fr]">
          {/* Left: Real-Time Optical Preview + Presets */}
          <div className="space-y-4">
            {/* Real-Time Preview Stage */}
            <div className="relative overflow-hidden rounded-2xl border border-slate-300/60 bg-slate-900 p-5 dark:border-white/15">
              {/* Background geometric pattern specifically designed to make optical refraction visible */}
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-90"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 20% 25%, #38bdf8 0%, transparent 45%),
                    radial-gradient(circle at 80% 70%, #818cf8 0%, transparent 48%),
                    repeating-linear-gradient(45deg, rgba(255,255,255,0.16) 0px, rgba(255,255,255,0.16) 8px, transparent 8px, transparent 22px)
                  `,
                }}
              />
              <div className="relative z-10 flex min-h-[190px] flex-col justify-between gap-4">
                <div className="text-[11px] font-medium text-white/85">
                  Vista previa óptica en vivo · Preset: {config.presetId === 'custom' ? 'Personalizado' : GLASS_PRESETS.find((p) => p.id === config.presetId)?.name}
                </div>

                <LiquidGlassSurface
                  variant="elevated"
                  className="p-4 text-slate-900 dark:text-white"
                >
                  <div className="text-sm font-semibold">
                    Superficie Liquid Glass
                  </div>
                  <p className="mt-1 text-xs opacity-85">
                    Observa la distorsión óptica del patrón diagonal en los bordes, el reflejo especular y la aberración cromática.
                  </p>
                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      className="liquid-glass-button rounded-xl px-3.5 py-1.5 text-xs font-semibold"
                    >
                      Botón vítreo
                    </button>
                    <button
                      type="button"
                      className="liquid-glass-button liquid-glass-button-accent rounded-xl px-3.5 py-1.5 text-xs font-semibold"
                    >
                      Acción óptica
                    </button>
                  </div>
                </LiquidGlassSurface>
              </div>
            </div>

            {/* Presets Selector */}
            <div>
              <h3 className="mb-2 text-xs font-semibold text-slate-700 dark:text-slate-200">
                Presets visuales
              </h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {GLASS_PRESETS.map((preset) => {
                  const active = config.presetId === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => onChange(getPresetConfig(preset.id))}
                      className={`liquid-glass-button flex min-h-[54px] flex-col items-start justify-center rounded-xl p-2.5 text-left ${
                        active ? 'ring-2 ring-sky-500' : ''
                      }`}
                    >
                      <span className="text-xs font-semibold">{preset.name}</span>
                      <span className="mt-0.5 line-clamp-1 text-[10px] opacity-75">
                        {preset.description}
                      </span>
                    </button>
                  );
                })}
                <div
                  className={`flex min-h-[54px] flex-col items-start justify-center rounded-xl border border-dashed border-slate-300/60 p-2.5 text-left dark:border-white/15 ${
                    config.presetId === 'custom'
                      ? 'ring-2 ring-sky-500 bg-sky-500/10'
                      : 'opacity-70'
                  }`}
                >
                  <span className="text-xs font-semibold">Personalizado</span>
                  <span className="mt-0.5 text-[10px] opacity-75">
                    Ajuste manual activo
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: 10 Optical Sliders + Individual Effect Toggles */}
          <div className="space-y-2">
            {SLIDERS.map((s) => {
              const val = config[s.key] as number;
              const isEnabled = s.toggleKey ? config.enabled[s.toggleKey] : true;

              return (
                <div
                  key={s.key}
                  className="rounded-xl border border-slate-300/50 bg-white/45 px-3 py-2.5 dark:border-white/12 dark:bg-slate-900/45"
                >
                  <div className="flex items-center justify-between gap-2">
                    <label
                      htmlFor={`slider-${s.key}`}
                      className="text-xs font-medium"
                    >
                      {s.label}
                    </label>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs tabular-nums opacity-85">
                        {val}
                        {s.unit}
                      </span>
                      {s.toggleKey && (
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isEnabled}
                          aria-label={`Activar o desactivar ${s.label}`}
                          onClick={() => toggleEffect(s.toggleKey!)}
                          className={`inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                            isEnabled
                              ? 'bg-sky-500'
                              : 'bg-slate-400/50 dark:bg-slate-700'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              isEnabled ? 'translate-x-4.5' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      )}
                    </div>
                  </div>
                  <input
                    id={`slider-${s.key}`}
                    type="range"
                    min={s.min}
                    max={s.max}
                    value={val}
                    disabled={!isEnabled}
                    onChange={(e) => updateField(s.key, Number(e.target.value))}
                    className="liquid-slider mt-2 w-full disabled:opacity-40"
                  />
                </div>
              );
            })}
          </div>
        </div>
      </LiquidGlassSurface>
    </div>
  );
};
