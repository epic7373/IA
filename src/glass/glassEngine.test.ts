import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_GLASS_CONFIG,
  buildOpticalDisplacementMapUri,
  computeGlassValues,
  getPresetConfig,
  sanitizeGlassConfig,
} from './glassEngine';

test('Glass Engine presets produce valid bounded configurations', () => {
  const prismatic = getPresetConfig('prismatic');
  assert.equal(prismatic.presetId, 'prismatic');
  assert.ok(prismatic.chromaticAberration > DEFAULT_GLASS_CONFIG.chromaticAberration);

  const minimal = getPresetConfig('minimal-glass');
  assert.equal(minimal.enabled.refraction, false);
  assert.equal(minimal.chromaticAberration, 0);
});

test('sanitizeGlassConfig clamps out-of-range values', () => {
  const sanitized = sanitizeGlassConfig({
    refractionIntensity: 250,
    blurIntensity: -5,
    transparency: 2,
    animationSpeed: 999,
  });
  assert.equal(sanitized.refractionIntensity, 100);
  assert.equal(sanitized.blurIntensity, 0);
  assert.equal(sanitized.transparency, 12);
  assert.equal(sanitized.animationSpeed, 200);
});

test('computeGlassValues disables heavy optical effects when reducedEffects is true', () => {
  const full = computeGlassValues(DEFAULT_GLASS_CONFIG, false);
  const reduced = computeGlassValues(DEFAULT_GLASS_CONFIG, true);
  assert.ok(full.displacementScale > 0);
  assert.equal(full.refractionActive, true);
  assert.equal(reduced.displacementScale, 0);
  assert.equal(reduced.refractionActive, false);
  assert.equal(reduced.chromaticPx, 0);
});

test('buildOpticalDisplacementMapUri returns valid encoded SVG data URI', () => {
  const uri = buildOpticalDisplacementMapUri(60);
  assert.ok(uri.startsWith('data:image/svg+xml;utf8,'));
  assert.ok(decodeURIComponent(uri).includes('radialGradient'));
});
