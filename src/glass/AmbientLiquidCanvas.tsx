import React, { useEffect, useRef } from 'react';
import { GENERATED_BACKDROPS } from '../core/seedData';
import type { BackgroundMode, ThemeMode } from '../types/liquid';

interface AmbientLiquidCanvasProps {
  theme: ThemeMode;
  backgroundMode: BackgroundMode;
  customBackgroundDataUrl: string;
  accentColor: string;
  lightingIntensity: number;
  animationSpeed: number;
  animationsActive: boolean;
  reducedEffects: boolean;
}

function hexToRgbNorm(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean.padEnd(6, '0').slice(0, 6);
  const num = parseInt(full, 16);
  if (Number.isNaN(num)) return [0.06, 0.52, 0.85];
  return [
    ((num >> 16) & 255) / 255,
    ((num >> 8) & 255) / 255,
    (num & 255) / 255,
  ];
}

export const AmbientLiquidCanvas: React.FC<AmbientLiquidCanvasProps> = React.memo(
  ({
    theme,
    backgroundMode,
    customBackgroundDataUrl,
    accentColor,
    lightingIntensity,
    animationSpeed,
    animationsActive,
    reducedEffects,
  }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const shouldRenderWebgl =
      !reducedEffects &&
      (backgroundMode === 'liquid-shader' || lightingIntensity > 5);

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas || !shouldRenderWebgl) return;

      const gl = canvas.getContext('webgl', {
        alpha: true,
        antialias: false,
        powerPreference: 'low-power',
      });
      if (!gl) return;

      const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
      const rendererName = debugInfo
        ? String(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) ?? '')
        : '';
      const isSoftwareGl = /swiftshader|llvmpipe|software/i.test(rendererName);

      // Keep internal shader resolution lightweight for near-zero GPU load
      canvas.width = 240;
      canvas.height = 140;
      gl.viewport(0, 0, canvas.width, canvas.height);

      const vertSrc = `
        attribute vec2 a_pos;
        varying vec2 v_uv;
        void main() {
          v_uv = a_pos * 0.5 + 0.5;
          gl_Position = vec4(a_pos, 0.0, 1.0);
        }
      `;

      const fragSrc = `
        precision mediump float;
        varying vec2 v_uv;
        uniform float u_time;
        uniform float u_dark;
        uniform float u_light;
        uniform vec3 u_accent;

        void main() {
          vec2 uv = v_uv;
          float t = u_time * 0.28;
          float w1 = sin(uv.x * 3.4 + t + sin(uv.y * 2.6 - t * 0.7));
          float w2 = cos(uv.y * 3.8 - t * 0.8 + cos(uv.x * 2.9 + t * 0.5));
          float caustic = smoothstep(0.1, 0.95, (w1 * w2) * 0.5 + 0.5);

          vec3 baseLight = vec3(0.92, 0.95, 0.98);
          vec3 baseDark = vec3(0.05, 0.08, 0.14);
          vec3 base = mix(baseLight, baseDark, u_dark);

          vec3 tintA = mix(base, u_accent, mix(0.18, 0.34, u_dark));
          vec3 tintB = mix(base, vec3(0.38, 0.72, 0.96), mix(0.14, 0.24, u_dark));

          vec3 col = mix(base, tintA, caustic * 0.72);
          col = mix(col, tintB, smoothstep(0.4, 1.0, sin(uv.x * 2.2 - uv.y * 1.9 + t) * 0.5 + 0.5) * 0.45);
          float alpha = mix(0.18, 0.88, u_light);
          gl_FragColor = vec4(col, alpha);
        }
      `;

      const compile = (type: number, src: string) => {
        const shader = gl.createShader(type);
        if (!shader) return null;
        gl.shaderSource(shader, src);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
          gl.deleteShader(shader);
          return null;
        }
        return shader;
      };

      const vs = compile(gl.VERTEX_SHADER, vertSrc);
      const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
      if (!vs || !fs) return;

      const prog = gl.createProgram();
      if (!prog) return;
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;

      gl.useProgram(prog);
      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
      );
      const loc = gl.getAttribLocation(prog, 'a_pos');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const uTime = gl.getUniformLocation(prog, 'u_time');
      const uDark = gl.getUniformLocation(prog, 'u_dark');
      const uLight = gl.getUniformLocation(prog, 'u_light');
      const uAccent = gl.getUniformLocation(prog, 'u_accent');

      const [ar, ag, ab] = hexToRgbNorm(accentColor);
      gl.uniform1f(uDark, theme === 'dark' ? 1.0 : 0.0);
      gl.uniform1f(
        uLight,
        backgroundMode === 'liquid-shader'
          ? Math.max(0.55, lightingIntensity / 100)
          : (lightingIntensity / 100) * 0.45
      );
      gl.uniform3f(uAccent, ar, ag, ab);

      let rafId = 0;
      let start = performance.now();
      let lastFrame = 0;
      const speedFactor = animationSpeed / 100;

      const drawFrame = (now: number) => {
        const elapsed = ((now - start) / 1000) * speedFactor;
        gl.uniform1f(uTime, elapsed);
        gl.drawArrays(gl.TRIANGLES, 0, 6);
      };

      // Render first frame immediately
      drawFrame(start);

      const loop = (now: number) => {
        if (!document.hidden && animationsActive && !isSoftwareGl) {
          // Cap to ~24 fps for low power footprint
          if (now - lastFrame >= 42) {
            lastFrame = now;
            drawFrame(now);
          }
          rafId = requestAnimationFrame(loop);
        }
      };

      if (animationsActive && !isSoftwareGl) {
        rafId = requestAnimationFrame(loop);
      }

      const handleVis = () => {
        if (!document.hidden && animationsActive && !isSoftwareGl) {
          start = performance.now();
          rafId = requestAnimationFrame(loop);
        } else {
          cancelAnimationFrame(rafId);
        }
      };
      document.addEventListener('visibilitychange', handleVis);

      return () => {
        cancelAnimationFrame(rafId);
        document.removeEventListener('visibilitychange', handleVis);
        gl.deleteBuffer(buf);
        gl.deleteProgram(prog);
        gl.deleteShader(vs);
        gl.deleteShader(fs);
      };
    }, [
      shouldRenderWebgl,
      theme,
      backgroundMode,
      accentColor,
      lightingIntensity,
      animationSpeed,
      animationsActive,
    ]);

    const backdropUrl =
      backgroundMode === 'custom-image' && customBackgroundDataUrl
        ? customBackgroundDataUrl
        : theme === 'dark'
          ? GENERATED_BACKDROPS.dark
          : GENERATED_BACKDROPS.light;

    return (
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none"
      >
        {/* Base neutral canvas */}
        <div
          className={`absolute inset-0 transition-colors duration-300 ${
            theme === 'dark'
              ? 'bg-slate-950'
              : 'bg-slate-100'
          }`}
        />

        {/* Optical photography / custom image backdrop */}
        {(backgroundMode === 'optical-waves' ||
          backgroundMode === 'custom-image') && (
          <img
            src={backdropUrl}
            alt=""
            referrerPolicy="no-referrer"
            className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
              theme === 'dark' ? 'opacity-65' : 'opacity-85'
            }`}
          />
        )}

        {/* Studio Slate subtle architectural gradient */}
        {backgroundMode === 'studio-slate' && (
          <div
            className="absolute inset-0"
            style={{
              background:
                theme === 'dark'
                  ? `radial-gradient(90% 70% at 15% 10%, color-mix(in srgb, ${accentColor} 18%, #0f172a), #020617 72%)`
                  : `radial-gradient(90% 70% at 15% 10%, color-mix(in srgb, ${accentColor} 14%, #f8fafc), #e2e8f0 75%)`,
            }}
          />
        )}

        {/* Low-overhead WebGL optical caustic shader */}
        {shouldRenderWebgl && (
          <canvas
            ref={canvasRef}
            data-testid="liquid-webgl-canvas"
            className="absolute inset-0 h-full w-full object-cover"
            style={{
              opacity:
                backgroundMode === 'liquid-shader'
                  ? 0.95
                  : Math.min(0.45, lightingIntensity / 220),
              mixBlendMode: theme === 'dark' ? 'screen' : 'soft-light',
            }}
          />
        )}

        {/* Soft contrast scrim to preserve WCAG AA readability across panels */}
        <div
          className={`absolute inset-0 ${
            theme === 'dark'
              ? 'bg-slate-950/32'
              : 'bg-white/18'
          }`}
        />
      </div>
    );
  }
);
