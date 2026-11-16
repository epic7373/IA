import type { GlassConfig, GlassPresetId } from '../types/liquid';

export interface GlassPresetMeta {
  id: Exclude<GlassPresetId, 'custom'>;
  name: string;
  description: string;
  config: Omit<GlassConfig, 'presetId'>;
}

export const GLASS_PRESETS: GlassPresetMeta[] = [
  {
    id: 'crystal',
    name: 'Crystal',
    description: 'Óptica nítida, bisel especular definido y refracción equilibrada.',
    config: {
      refractionIntensity: 55,
      blurIntensity: 22,
      chromaticAberration: 28,
      specularIntensity: 60,
      transparency: 54,
      borderGlow: 56,
      glassDepth: 55,
      shadowIntensity: 42,
      animationSpeed: 100,
      lightingIntensity: 68,
      enabled: {
        refraction: true,
        blur: true,
        chromaticAberration: true,
        specular: true,
        borderGlow: true,
        shadows: true,
        animations: true,
        lighting: true,
      },
    },
  },
  {
    id: 'soft-glass',
    name: 'Soft Glass',
    description: 'Difusión aterciopelada con reflejos suaves y baja dispersión cromática.',
    config: {
      refractionIntensity: 32,
      blurIntensity: 32,
      chromaticAberration: 10,
      specularIntensity: 38,
      transparency: 68,
      borderGlow: 34,
      glassDepth: 36,
      shadowIntensity: 28,
      animationSpeed: 90,
      lightingIntensity: 48,
      enabled: {
        refraction: true,
        blur: true,
        chromaticAberration: true,
        specular: true,
        borderGlow: true,
        shadows: true,
        animations: true,
        lighting: true,
      },
    },
  },
  {
    id: 'deep-glass',
    name: 'Deep Glass',
    description: 'Mayor grosor óptico, sombras ambientales profundas y alta densidad.',
    config: {
      refractionIntensity: 74,
      blurIntensity: 26,
      chromaticAberration: 36,
      specularIntensity: 68,
      transparency: 42,
      borderGlow: 66,
      glassDepth: 88,
      shadowIntensity: 78,
      animationSpeed: 95,
      lightingIntensity: 76,
      enabled: {
        refraction: true,
        blur: true,
        chromaticAberration: true,
        specular: true,
        borderGlow: true,
        shadows: true,
        animations: true,
        lighting: true,
      },
    },
  },
  {
    id: 'prismatic',
    name: 'Prismatic',
    description: 'Dispersión espectral acentuada, reflejos vivos y refracción intensa.',
    config: {
      refractionIntensity: 88,
      blurIntensity: 18,
      chromaticAberration: 82,
      specularIntensity: 85,
      transparency: 48,
      borderGlow: 86,
      glassDepth: 72,
      shadowIntensity: 52,
      animationSpeed: 120,
      lightingIntensity: 92,
      enabled: {
        refraction: true,
        blur: true,
        chromaticAberration: true,
        specular: true,
        borderGlow: true,
        shadows: true,
        animations: true,
        lighting: true,
      },
    },
  },
  {
    id: 'minimal-glass',
    name: 'Minimal Glass',
    description: 'Superficie limpia con desenfoque sutil, mínima distorsión y máximo contraste.',
    config: {
      refractionIntensity: 10,
      blurIntensity: 14,
      chromaticAberration: 0,
      specularIntensity: 22,
      transparency: 78,
      borderGlow: 20,
      glassDepth: 20,
      shadowIntensity: 18,
      animationSpeed: 100,
      lightingIntensity: 24,
      enabled: {
        refraction: false,
        blur: true,
        chromaticAberration: false,
        specular: true,
        borderGlow: true,
        shadows: true,
        animations: true,
        lighting: false,
      },
    },
  },
];

export const DEFAULT_GLASS_CONFIG: GlassConfig = {
  presetId: 'crystal',
  ...GLASS_PRESETS[0].config,
};

export function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}

export function getPresetConfig(presetId: Exclude<GlassPresetId, 'custom'>): GlassConfig {
  const found = GLASS_PRESETS.find((p) => p.id === presetId) ?? GLASS_PRESETS[0];
  return {
    presetId: found.id,
    ...found.config,
    enabled: { ...found.config.enabled },
  };
}

export function sanitizeGlassConfig(input: Partial<GlassConfig>): GlassConfig {
  const base = DEFAULT_GLASS_CONFIG;
  return {
    presetId: input.presetId ?? base.presetId,
    refractionIntensity: clamp(input.refractionIntensity ?? base.refractionIntensity, 0, 100),
    blurIntensity: clamp(input.blurIntensity ?? base.blurIntensity, 0, 48),
    chromaticAberration: clamp(input.chromaticAberration ?? base.chromaticAberration, 0, 100),
    specularIntensity: clamp(input.specularIntensity ?? base.specularIntensity, 0, 100),
    transparency: clamp(input.transparency ?? base.transparency, 12, 92),
    borderGlow: clamp(input.borderGlow ?? base.borderGlow, 0, 100),
    glassDepth: clamp(input.glassDepth ?? base.glassDepth, 0, 100),
    shadowIntensity: clamp(input.shadowIntensity ?? base.shadowIntensity, 0, 100),
    animationSpeed: clamp(input.animationSpeed ?? base.animationSpeed, 25, 200),
    lightingIntensity: clamp(input.lightingIntensity ?? base.lightingIntensity, 0, 100),
    enabled: {
      refraction: input.enabled?.refraction ?? base.enabled.refraction,
      blur: input.enabled?.blur ?? base.enabled.blur,
      chromaticAberration:
        input.enabled?.chromaticAberration ?? base.enabled.chromaticAberration,
      specular: input.enabled?.specular ?? base.enabled.specular,
      borderGlow: input.enabled?.borderGlow ?? base.enabled.borderGlow,
      shadows: input.enabled?.shadows ?? base.enabled.shadows,
      animations: input.enabled?.animations ?? base.enabled.animations,
      lighting: input.enabled?.lighting ?? base.enabled.lighting,
    },
  };
}

export interface ComputedGlassValues {
  cssVars: Record<string, string>;
  displacementScale: number;
  buttonDisplacementScale: number;
  chromaticPx: number;
  refractionActive: boolean;
  lightingActive: boolean;
  animationsActive: boolean;
}

export function computeGlassValues(
  config: GlassConfig,
  reducedEffects: boolean
): ComputedGlassValues {
  const eff = config.enabled;
  const refractionActive = !reducedEffects && eff.refraction && config.refractionIntensity > 0;
  const blurPx = eff.blur
    ? reducedEffects
      ? Math.min(10, config.blurIntensity)
      : config.blurIntensity
    : 0;
  const chromaticPx =
    !reducedEffects && eff.chromaticAberration
      ? Number(((config.chromaticAberration / 100) * 3.5).toFixed(2))
      : 0;
  const specular = eff.specular ? Number((config.specularIntensity / 100).toFixed(2)) : 0;
  const transparency = Number((config.transparency / 100).toFixed(2));
  const borderGlow = eff.borderGlow ? Number((config.borderGlow / 100).toFixed(2)) : 0;
  const depth = eff.shadows
    ? Number((0.4 + (config.glassDepth / 100) * 1.1).toFixed(2))
    : 0.35;
  const shadow = eff.shadows ? Number(((config.shadowIntensity / 100) * 0.48).toFixed(2)) : 0;
  const animSpeed = eff.animations ? Number((config.animationSpeed / 100).toFixed(2)) : 0.01;
  const lighting =
    !reducedEffects && eff.lighting ? Number((config.lightingIntensity / 100).toFixed(2)) : 0;

  const displacementScale = refractionActive
    ? Math.round((config.refractionIntensity / 100) * 42)
    : 0;
  const buttonDisplacementScale = refractionActive
    ? Math.round((config.refractionIntensity / 100) * 24)
    : 0;

  return {
    cssVars: {
      '--lg-refraction': String(refractionActive ? config.refractionIntensity : 0),
      '--lg-blur': `${blurPx}px`,
      '--lg-chromatic': `${chromaticPx}px`,
      '--lg-specular': String(specular),
      '--lg-transparency': String(transparency),
      '--lg-border-glow': String(borderGlow),
      '--lg-depth': String(depth),
      '--lg-shadow': String(shadow),
      '--lg-anim-speed': String(animSpeed),
      '--lg-lighting': String(lighting),
    },
    displacementScale,
    buttonDisplacementScale,
    chromaticPx,
    refractionActive,
    lightingActive: lighting > 0,
    animationsActive: !reducedEffects && eff.animations,
  };
}

/**
 * Generates a smooth optical lens displacement map as an SVG data URI for feImage + feDisplacementMap.
 * Creates realistic edge curvature refraction (like beveled thick optical glass) without noisy artifacts.
 */
export function buildOpticalDisplacementMapUri(depthPercent: number): string {
  const edgeStop = clamp(Math.round(82 - (depthPercent / 100) * 20), 58, 90);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" preserveAspectRatio="none">
    <defs>
      <linearGradient id="xGrad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stop-color="rgb(255,128,128)"/>
        <stop offset="12%" stop-color="rgb(156,128,128)"/>
        <stop offset="50%" stop-color="rgb(128,128,128)"/>
        <stop offset="88%" stop-color="rgb(100,128,128)"/>
        <stop offset="100%" stop-color="rgb(0,128,128)"/>
      </linearGradient>
      <linearGradient id="yGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="rgb(128,255,128)" stop-opacity="0.9"/>
        <stop offset="14%" stop-color="rgb(128,154,128)" stop-opacity="0.5"/>
        <stop offset="50%" stop-color="rgb(128,128,128)" stop-opacity="0"/>
        <stop offset="86%" stop-color="rgb(128,102,128)" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="rgb(128,0,128)" stop-opacity="0.9"/>
      </linearGradient>
      <radialGradient id="lensDome" cx="50%" cy="50%" r="54%">
        <stop offset="0%" stop-color="rgb(128,128,128)" stop-opacity="0"/>
        <stop offset="${edgeStop}%" stop-color="rgb(138,138,128)" stop-opacity="0.35"/>
        <stop offset="100%" stop-color="rgb(170,170,128)" stop-opacity="0.75"/>
      </radialGradient>
    </defs>
    <rect width="256" height="256" fill="rgb(128,128,128)"/>
    <rect width="256" height="256" fill="url(#xGrad)" opacity="0.65"/>
    <rect width="256" height="256" fill="url(#yGrad)" style="mix-blend-mode:screen"/>
    <rect width="256" height="256" fill="url(#lensDome)"/>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
