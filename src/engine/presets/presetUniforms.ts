import type { FilmPreset, ToneCurve, HSLAdjustment } from './FilmPreset';

/**
 * Converts a FilmPreset + intensity into shader uniform values.
 * This bridges the high-level preset definition to low-level GPU parameters.
 */

// ─── Simple preset shader uniforms ───

export interface SimplePresetUniforms {
  blackPoint: number;
  whitePoint: number;
  contrast: number;
  shadowTint: number[];   // [R, G, B, strength]
  highlightTint: number[]; // [R, G, B, strength]
  splitBalance: number;
  saturation: number;
  intensity: number;
}

/**
 * Convert hue (degrees) to multiply-blend-safe RGB tint.
 * 0.5 = neutral (no tint), >0.5 = boost, <0.5 = reduce.
 */
function hueToTintRgb(hueDegrees: number): [number, number, number] {
  const h = ((hueDegrees % 360) + 360) % 360;
  const c = 1;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));

  let r = 0, g = 0, b = 0;
  if (h < 60) { r = c; g = x; b = 0; }
  else if (h < 120) { r = x; g = c; b = 0; }
  else if (h < 180) { r = 0; g = c; b = x; }
  else if (h < 240) { r = 0; g = x; b = c; }
  else if (h < 300) { r = x; g = 0; b = c; }
  else { r = c; g = 0; b = x; }

  // Map to 0.5-centered for multiply blend: color * tint * 2
  // At 0.5 → color * 1.0 = no change
  return [r * 0.5 + 0.25, g * 0.5 + 0.25, b * 0.5 + 0.25];
}

/**
 * Build uniforms for the SIMPLE preset shader (fallback).
 */
export function buildSimplePresetUniforms(preset: FilmPreset, intensity: number): SimplePresetUniforms {
  const masterCurve = preset.toneCurves.master;
  // Normalize contrast: 0.5 = no S-curve, >0.5 = more contrast
  const contrast = Math.max(0, (masterCurve.shadowContrast - 0.35) * 1.5);

  const [sr, sg, sb] = hueToTintRgb(preset.splitTone.shadowHue);
  const [hr, hg, hb] = hueToTintRgb(preset.splitTone.highlightHue);

  return {
    blackPoint: masterCurve.blackPoint,
    whitePoint: masterCurve.whitePoint,
    contrast: Math.min(contrast, 1.0),
    shadowTint: [sr, sg, sb, preset.splitTone.shadowSaturation],
    highlightTint: [hr, hg, hb, preset.splitTone.highlightSaturation],
    splitBalance: preset.splitTone.balance,
    saturation: 1.0,  // Color matrix already handles saturation — don't double-apply
    intensity: intensity / 100,
  };
}

// ─── Complex film shader uniforms ───

export interface FilmShaderUniforms {
  toneMasterA: number[];  // [bp, wp, sc, hr]
  toneMasterB: number;    // pivot
  toneRedA: number[];
  toneRedB: number;
  toneGreenA: number[];
  toneGreenB: number;
  toneBlueA: number[];
  toneBlueB: number;
  splitToneA: number[];   // [shadowH, shadowS, highlightH, highlightS]
  splitToneB: number;     // balance
  satVibrance: number[];  // [sat, vibrance]
  hsl0A: number[]; hsl0B: number;
  hsl1A: number[]; hsl1B: number;
  hsl2A: number[]; hsl2B: number;
  hsl3A: number[]; hsl3B: number;
  hsl4A: number[]; hsl4B: number;
  hsl5A: number[]; hsl5B: number;
  hslCount: number;
  intensity: number;
}

export interface GrainShaderUniforms {
  grainIntensity: number;
  grainSize: number;
  grainLumResponse: number;
  grainSeed: number;
}

function curveToUniformA(curve: ToneCurve): number[] {
  return [curve.blackPoint, curve.whitePoint, curve.shadowContrast, curve.highlightRolloff];
}

function hslToUniformA(adj: HSLAdjustment): number[] {
  // Scale saturation deviation by 0.25 to prevent double-saturation.
  // The preset's colorMatrix already contributes channel-level saturation;
  // applying full HSL satMult on top produces oversaturation.
  // Scaling: 1.30 → 1.075, 1.20 → 1.05, 0.80 → 0.95 (reductions also moderated).
  const scaledSat = 1.0 + (adj.saturationMult - 1.0) * 0.25;
  return [
    adj.hueCenter / 360,     // Normalize to 0-1
    adj.hueRange / 360,      // Normalize to 0-1
    adj.hueShift / 360,      // Normalize shift
    scaledSat,
  ];
}

const EMPTY_HSL_A = [0, 0, 0, 1];  // No-op: satMult=1

/**
 * Build all uniform values from a preset at given intensity.
 */
export function buildFilmUniforms(preset: FilmPreset, intensity: number): FilmShaderUniforms {
  const hslAdj = preset.hslAdjustments;
  const hslCount = Math.min(hslAdj.length, 6);

  return {
    // Tone curves
    toneMasterA: curveToUniformA(preset.toneCurves.master),
    toneMasterB: preset.toneCurves.master.midtonePivot,
    toneRedA: curveToUniformA(preset.toneCurves.red),
    toneRedB: preset.toneCurves.red.midtonePivot,
    toneGreenA: curveToUniformA(preset.toneCurves.green),
    toneGreenB: preset.toneCurves.green.midtonePivot,
    toneBlueA: curveToUniformA(preset.toneCurves.blue),
    toneBlueB: preset.toneCurves.blue.midtonePivot,

    // Split tone (hue normalized to 0-1)
    splitToneA: [
      preset.splitTone.shadowHue / 360,
      preset.splitTone.shadowSaturation,
      preset.splitTone.highlightHue / 360,
      preset.splitTone.highlightSaturation,
    ],
    splitToneB: preset.splitTone.balance,

    // Saturation & vibrance
    satVibrance: [preset.saturationBoost, preset.vibranceBoost],

    // HSL adjustments (pad to 6 slots)
    hsl0A: hslCount > 0 ? hslToUniformA(hslAdj[0]) : EMPTY_HSL_A,
    hsl0B: hslCount > 0 ? hslAdj[0].luminanceShift : 0,
    hsl1A: hslCount > 1 ? hslToUniformA(hslAdj[1]) : EMPTY_HSL_A,
    hsl1B: hslCount > 1 ? hslAdj[1].luminanceShift : 0,
    hsl2A: hslCount > 2 ? hslToUniformA(hslAdj[2]) : EMPTY_HSL_A,
    hsl2B: hslCount > 2 ? hslAdj[2].luminanceShift : 0,
    hsl3A: hslCount > 3 ? hslToUniformA(hslAdj[3]) : EMPTY_HSL_A,
    hsl3B: hslCount > 3 ? hslAdj[3].luminanceShift : 0,
    hsl4A: hslCount > 4 ? hslToUniformA(hslAdj[4]) : EMPTY_HSL_A,
    hsl4B: hslCount > 4 ? hslAdj[4].luminanceShift : 0,
    hsl5A: hslCount > 5 ? hslToUniformA(hslAdj[5]) : EMPTY_HSL_A,
    hsl5B: hslCount > 5 ? hslAdj[5].luminanceShift : 0,

    hslCount,
    intensity: intensity / 100,  // Normalize 0-100 → 0-1
  };
}

/**
 * Build grain uniform values.
 */
export function buildGrainUniforms(preset: FilmPreset, intensity: number): GrainShaderUniforms {
  return {
    grainIntensity: preset.grain.intensity * (intensity / 100),
    grainSize: preset.grain.size,
    grainLumResponse: preset.grain.luminanceResponse,
    grainSeed: Math.random() * 100,  // Fixed per frame, changes per re-render
  };
}
