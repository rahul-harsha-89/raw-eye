import { Skia } from '@shopify/react-native-skia';

/**
 * SKSL shader for pro-grade film emulation.
 * Implements: per-channel tone curves + split toning + HSL-selective adjustments.
 * All in a single GPU fragment shader pass — 60fps on mobile.
 *
 * Uniform layout (all floats):
 * - toneCurve_master: [blackPoint, whitePoint, shadowContrast, highlightRolloff, midtonePivot]
 * - toneCurve_red: same 5 params
 * - toneCurve_green: same 5 params
 * - toneCurve_blue: same 5 params
 * - splitTone: [shadowH, shadowS, highlightH, highlightS, balance]
 * - satVibrance: [saturation, vibrance]
 * - hsl0..hsl5: [hueCenter, hueRange, hueShift, satMult, lumShift] x6
 * - intensity: [mix] (0-1 blend with original)
 */

export const FILM_EMULATION_SKSL = `
uniform shader image;
uniform float2 resolution;

// Tone curve params: [blackPoint, whitePoint, shadowContrast, highlightRolloff, midtonePivot]
uniform half4 toneMasterA;    // master: bp, wp, sc, hr
uniform half  toneMasterB;    // master: pivot
uniform half4 toneRedA;
uniform half  toneRedB;
uniform half4 toneGreenA;
uniform half  toneGreenB;
uniform half4 toneBlueA;
uniform half  toneBlueB;

// Split tone: [shadowHue(0-1), shadowSat, highlightHue(0-1), highlightSat, balance]
uniform half4 splitToneA;     // shadowH, shadowS, highlightH, highlightS
uniform half  splitToneB;     // balance

// Saturation/vibrance: [satMult, vibranceMult]
uniform half2 satVibrance;

// HSL adjustments (up to 6): [hueCenter(0-1), hueRange(0-1), hueShift, satMult, lumShift]
uniform half4 hsl0A; uniform half hsl0B;
uniform half4 hsl1A; uniform half hsl1B;
uniform half4 hsl2A; uniform half hsl2B;
uniform half4 hsl3A; uniform half hsl3B;
uniform half4 hsl4A; uniform half hsl4B;
uniform half4 hsl5A; uniform half hsl5B;

// Mix intensity (0 = original, 1 = full preset)
uniform half intensity;

// Number of active HSL adjustments (0-6)
uniform half hslCount;

// ─── Tone curve: attempt smooth S-curve via cubic bezier approximation ───
half applyCurve(half x, half bp, half wp, half sc, half hr, half pivot) {
  // Remap to black/white point range
  half range = wp - bp;
  half normalized = (x - bp) / range;
  normalized = clamp(normalized, 0.0, 1.0);

  // S-curve using smoothstep-based approach
  // Shadow region: controlled by shadowContrast
  // Highlight region: controlled by highlightRolloff
  half shadow = smoothstep(0.0, pivot, normalized);
  half highlight = smoothstep(pivot, 1.0, normalized);

  // Blend shadow contrast (higher sc = steeper shadows)
  half shadowCurve = pow(shadow, 2.0 - sc);

  // Blend highlight rolloff (higher hr = gentler shoulder)
  half highlightCurve = 1.0 - pow(1.0 - highlight, 1.0 + hr);

  // Combine: below pivot use shadow curve, above use highlight curve
  half result;
  if (normalized <= pivot) {
    result = shadowCurve * pivot;
  } else {
    result = pivot + highlightCurve * (1.0 - pivot);
  }

  // Map back to bp..wp range and clamp
  return clamp(bp + result * range, 0.0, 1.0);
}

// ─── RGB <-> HSL conversion ───
half3 rgb2hsl(half3 c) {
  half maxC = max(max(c.r, c.g), c.b);
  half minC = min(min(c.r, c.g), c.b);
  half l = (maxC + minC) * 0.5;

  if (maxC == minC) return half3(0.0, 0.0, l);

  half d = maxC - minC;
  half s = l > 0.5 ? d / (2.0 - maxC - minC) : d / (maxC + minC);

  half h;
  if (maxC == c.r) h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
  else if (maxC == c.g) h = (c.b - c.r) / d + 2.0;
  else h = (c.r - c.g) / d + 4.0;
  h /= 6.0;

  return half3(h, s, l);
}

half hue2rgb(half p, half q, half t) {
  if (t < 0.0) t += 1.0;
  if (t > 1.0) t -= 1.0;
  if (t < 1.0/6.0) return p + (q - p) * 6.0 * t;
  if (t < 0.5) return q;
  if (t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
  return p;
}

half3 hsl2rgb(half3 hsl) {
  if (hsl.y == 0.0) return half3(hsl.z);

  half q = hsl.z < 0.5 ? hsl.z * (1.0 + hsl.y) : hsl.z + hsl.y - hsl.z * hsl.y;
  half p = 2.0 * hsl.z - q;

  return half3(
    hue2rgb(p, q, hsl.x + 1.0/3.0),
    hue2rgb(p, q, hsl.x),
    hue2rgb(p, q, hsl.x - 1.0/3.0)
  );
}

// ─── Soft light blend (used for split toning) ───
half softLight(half base, half blend) {
  if (blend < 0.5) {
    return base - (1.0 - 2.0 * blend) * base * (1.0 - base);
  } else {
    half d = base <= 0.25 ? ((16.0 * base - 12.0) * base + 4.0) * base : sqrt(base);
    return base + (2.0 * blend - 1.0) * (d - base);
  }
}

// ─── Apply one HSL adjustment ───
half3 applyHSL(half3 hsl, half4 params, half lumShift) {
  half hueCenter = params.x;  // 0-1
  half hueRange = params.y;   // 0-1
  half hueShift = params.z;   // -0.1 to +0.1 (pre-normalized)
  half satMult = params.w;

  // Circular hue distance
  half hueDist = abs(hsl.x - hueCenter);
  if (hueDist > 0.5) hueDist = 1.0 - hueDist;

  // Feathered mask
  half mask = 1.0 - smoothstep(0.0, hueRange, hueDist);

  // Apply shifts
  hsl.x += hueShift * mask;
  if (hsl.x < 0.0) hsl.x += 1.0;
  if (hsl.x > 1.0) hsl.x -= 1.0;

  hsl.y *= mix(1.0, satMult, mask);
  hsl.z += lumShift * mask;
  hsl.z = clamp(hsl.z, 0.0, 1.0);

  return hsl;
}

half4 main(float2 coord) {
  half4 original = image.eval(coord);
  half3 color = original.rgb;

  // ═══ Stage 1: Per-channel tone curves ═══
  color.r = applyCurve(color.r, toneRedA.x, toneRedA.y, toneRedA.z, toneRedA.w, toneRedB);
  color.g = applyCurve(color.g, toneGreenA.x, toneGreenA.y, toneGreenA.z, toneGreenA.w, toneGreenB);
  color.b = applyCurve(color.b, toneBlueA.x, toneBlueA.y, toneBlueA.z, toneBlueA.w, toneBlueB);

  // Apply master curve on luminance
  half lum = dot(color, half3(0.2126, 0.7152, 0.0722));
  half newLum = applyCurve(lum, toneMasterA.x, toneMasterA.y, toneMasterA.z, toneMasterA.w, toneMasterB);
  half lumRatio = lum > 0.001 ? newLum / lum : 1.0;
  color *= lumRatio;
  color = clamp(color, half3(0.0), half3(1.0));

  // ═══ Stage 2: Split toning ═══
  half splitLum = dot(color, half3(0.2126, 0.7152, 0.0722));

  // Shadow tint — use 0.4 saturation so the tint adds hue without oversaturating
  half3 shadowTint = hsl2rgb(half3(splitToneA.x, 0.4h, 0.5h));
  half shadowMask = (1.0 - smoothstep(0.0, 0.5 + splitToneB * 0.3, splitLum)) * splitToneA.y;

  // Highlight tint — same moderate saturation
  half3 highlightTint = hsl2rgb(half3(splitToneA.z, 0.4h, 0.5h));
  half highlightMask = smoothstep(0.5 - splitToneB * 0.3, 1.0, splitLum) * splitToneA.w;

  // Apply via soft light blend
  color.r = mix(color.r, softLight(color.r, shadowTint.r), shadowMask);
  color.g = mix(color.g, softLight(color.g, shadowTint.g), shadowMask);
  color.b = mix(color.b, softLight(color.b, shadowTint.b), shadowMask);

  color.r = mix(color.r, softLight(color.r, highlightTint.r), highlightMask);
  color.g = mix(color.g, softLight(color.g, highlightTint.g), highlightMask);
  color.b = mix(color.b, softLight(color.b, highlightTint.b), highlightMask);

  // ═══ Stage 3: HSL selective adjustments ═══
  half3 hsl = rgb2hsl(color);

  if (hslCount > 0.5) hsl = applyHSL(hsl, hsl0A, hsl0B);
  if (hslCount > 1.5) hsl = applyHSL(hsl, hsl1A, hsl1B);
  if (hslCount > 2.5) hsl = applyHSL(hsl, hsl2A, hsl2B);
  if (hslCount > 3.5) hsl = applyHSL(hsl, hsl3A, hsl3B);
  if (hslCount > 4.5) hsl = applyHSL(hsl, hsl4A, hsl4B);
  if (hslCount > 5.5) hsl = applyHSL(hsl, hsl5A, hsl5B);

  color = hsl2rgb(hsl);

  // ═══ Stage 4: Saturation & vibrance ═══
  half gray = dot(color, half3(0.2126, 0.7152, 0.0722));

  // Standard saturation
  color = mix(half3(gray), color, satVibrance.x);

  // Vibrance: boost less-saturated colors more
  half currentSat = max(max(color.r, color.g), color.b) - min(min(color.r, color.g), color.b);
  half vibranceMask = 1.0 - currentSat;  // Less saturated = more boost
  half vibAdj = mix(1.0, satVibrance.y, vibranceMask);
  color = mix(half3(gray), color, vibAdj);

  color = clamp(color, half3(0.0), half3(1.0));

  // ═══ Final: blend with original by intensity ═══
  color = mix(original.rgb, color, intensity);

  return half4(color, original.a);
}
`;

/**
 * SKSL shader for film grain.
 * Separate from tone/color to allow independent intensity control.
 * Uses simplex-like noise, luminance-adaptive blending.
 */
export const FILM_GRAIN_SKSL = `
uniform shader image;
uniform float2 resolution;
uniform half grainIntensity;    // 0-1
uniform half grainSize;         // pixel scale multiplier
uniform half grainLumResponse;  // how much grain responds to luminance
uniform half grainSeed;         // random seed (frame/time based for animation, or fixed)

// Simple hash-based noise
half hash(float2 p) {
  float3 p3 = fract(float3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}

// Value noise with interpolation
half noise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);  // smoothstep interpolation

  half a = hash(i);
  half b = hash(i + float2(1.0, 0.0));
  half c = hash(i + float2(0.0, 1.0));
  half d = hash(i + float2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

half4 main(float2 coord) {
  half4 color = image.eval(coord);

  if (grainIntensity < 0.001) return color;

  // Generate noise at grain-size-scaled coordinates
  float2 noiseCoord = coord / grainSize + float2(grainSeed * 127.1, grainSeed * 311.7);
  half grain = noise(noiseCoord) * 2.0 - 1.0;  // -1 to 1

  // Add octave for texture
  grain += (noise(noiseCoord * 2.0) * 2.0 - 1.0) * 0.5;
  grain *= 0.667;  // normalize back

  // Luminance-adaptive response: less grain in deep shadows and bright highlights
  half lum = dot(color.rgb, half3(0.2126, 0.7152, 0.0722));
  half lumMask = mix(1.0, 4.0 * lum * (1.0 - lum), grainLumResponse);  // parabolic: peaks at 0.5

  // Apply grain
  half grainAmount = grain * grainIntensity * lumMask;
  color.rgb += half3(grainAmount);
  color.rgb = clamp(color.rgb, half3(0.0), half3(1.0));

  return color;
}
`;

/**
 * SIMPLE fallback preset shader (~30 lines).
 * Handles the essential non-linear effects that a color matrix CANNOT do:
 * - Black/white point remapping (tone curve approximation)
 * - S-curve contrast via smoothstep polynomial
 * - Luminance-dependent split toning (teal shadows / warm highlights etc.)
 * - Saturation/vibrance adjustment
 *
 * This shader is designed to compile on ANY mobile GPU (Adreno, Mali, PowerVR).
 * No branching, no loops, no complex functions. All straight-line math.
 */
export const SIMPLE_PRESET_SKSL = `
uniform shader image;
uniform float2 resolution;

uniform half blackPoint;
uniform half whitePoint;
uniform half contrast;

uniform half4 shadowTint;
uniform half4 highlightTint;
uniform half splitBalance;

uniform half saturation;
uniform half intensity;

half4 main(float2 coord) {
  half4 original = image.eval(coord);
  half3 color = original.rgb;

  half range = max(whitePoint - blackPoint, 0.01);
  color = clamp((color - half3(blackPoint)) / half3(range), half3(0.0), half3(1.0));

  half3 curved = color * color * (3.0 - 2.0 * color);
  color = mix(color, curved, half3(contrast));

  half lum = dot(color, half3(0.2126, 0.7152, 0.0722));

  half sMask = (1.0 - smoothstep(0.0, 0.5 + splitBalance * 0.3, lum)) * shadowTint.w;
  color = mix(color, color * shadowTint.rgb * 2.0, half3(sMask));

  half hMask = smoothstep(0.5 - splitBalance * 0.3, 1.0, lum) * highlightTint.w;
  color = mix(color, color * highlightTint.rgb * 2.0, half3(hMask));

  half gray = dot(color, half3(0.2126, 0.7152, 0.0722));
  color = mix(half3(gray), color, half3(saturation));

  color = clamp(color, half3(0.0), half3(1.0));
  color = mix(original.rgb, color, half3(intensity));

  return half4(color, original.a);
}
`;

/**
 * Create RuntimeEffect for the film emulation shader.
 */
export function createFilmEffect() {
  try {
    const effect = Skia.RuntimeEffect.Make(FILM_EMULATION_SKSL);
    if (effect) {
      console.log('[Shader] Complex film shader compiled successfully');
    } else {
      console.warn('[Shader] Complex film shader returned null');
    }
    return effect;
  } catch (e) {
    console.warn('[Shader] Film emulation shader failed to compile:', e);
    return null;
  }
}

/**
 * Create RuntimeEffect for the SIMPLE preset shader (fallback).
 */
export function createSimplePresetEffect() {
  try {
    const effect = Skia.RuntimeEffect.Make(SIMPLE_PRESET_SKSL);
    if (effect) {
      console.log('[Shader] Simple preset shader compiled successfully');
    } else {
      console.warn('[Shader] Simple preset shader returned null');
    }
    return effect;
  } catch (e) {
    console.warn('[Shader] Simple preset shader failed to compile:', e);
    return null;
  }
}

/**
 * Create RuntimeEffect for the grain shader.
 */
export function createGrainEffect() {
  try {
    return Skia.RuntimeEffect.Make(FILM_GRAIN_SKSL);
  } catch (e) {
    console.warn('[Shader] Film grain shader failed to compile:', e);
    return null;
  }
}
