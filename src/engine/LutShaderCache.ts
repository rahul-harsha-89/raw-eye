/**
 * LutShaderCache — compiles and caches per-preset 3D LUT shaders.
 *
 * Strategy: bake the LUT Float32Array directly into the SKSL source as a
 * `const half3[]` constant.  No texture API needed.  Compiled once per
 * preset ID, cached in a module-level Map.
 *
 * If compilation fails (null from Skia.RuntimeEffect.Make) the null is
 * cached too, so the caller can fall back to the existing film shader.
 */

import { Skia, type SkRuntimeEffect } from '@shopify/react-native-skia';
import type { FilmPreset } from './presets/FilmPreset';
import { generateLutFromPreset, LUT_SIZE, lutDataToSkslConst } from './LutGenerator';

// Module-level cache: preset ID → compiled effect (null = failed)
const effectCache = new Map<string, SkRuntimeEffect | null>();

// ─── SKSL source builder ──────────────────────────────────────────────────────

function buildLutShaderSource(lutData: Float32Array, size: number): string {
  // lutDataToSkslConst returns "half3 lut[N] = half3[](...);"
  // We need "const" for a module-level SkSL declaration.
  const lutDecl = 'const ' + lutDataToSkslConst(lutData, size);
  const N  = size;
  const N2 = N * N; // 81 for size=9
  const Nm1 = (N - 1).toFixed(1) + 'h'; // "8.0h"

  return `
uniform shader image;
uniform float2 resolution;
uniform float  intensity;

${lutDecl}

half3 lutLookup(half3 c) {
  const int N  = ${N};
  const int N2 = ${N2};

  half3 p = clamp(c, 0.0h, 1.0h) * ${Nm1};

  int ri = min(int(p.r), N - 2);
  int gi = min(int(p.g), N - 2);
  int bi = min(int(p.b), N - 2);

  half fr = p.r - half(ri);
  half fg = p.g - half(gi);
  half fb = p.b - half(bi);

  // 8 corners of the surrounding LUT cube
  half3 c000 = lut[ bi      * N2 +  gi      * N + ri    ];
  half3 c100 = lut[ bi      * N2 +  gi      * N + ri + 1];
  half3 c010 = lut[ bi      * N2 + (gi + 1) * N + ri    ];
  half3 c110 = lut[ bi      * N2 + (gi + 1) * N + ri + 1];
  half3 c001 = lut[(bi + 1) * N2 +  gi      * N + ri    ];
  half3 c101 = lut[(bi + 1) * N2 +  gi      * N + ri + 1];
  half3 c011 = lut[(bi + 1) * N2 + (gi + 1) * N + ri    ];
  half3 c111 = lut[(bi + 1) * N2 + (gi + 1) * N + ri + 1];

  // Trilinear interpolation
  half3 c00 = mix(c000, c100, fr);
  half3 c10 = mix(c010, c110, fr);
  half3 c01 = mix(c001, c101, fr);
  half3 c11 = mix(c011, c111, fr);
  half3 c0  = mix(c00,  c10,  fg);
  half3 c1  = mix(c01,  c11,  fg);
  return mix(c0, c1, fb);
}

half4 main(float2 coord) {
  half4 col     = image.eval(coord);
  half3 mapped  = lutLookup(col.rgb);
  return half4(mix(col.rgb, mapped, half(intensity)), col.a);
}
`;
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Return a compiled SkRuntimeEffect for the given preset, creating and caching
 * it on first call.  Returns null if compilation fails — caller should fall
 * back to the film/simple shader pipeline.
 */
export function getLutEffect(presetId: string, preset: FilmPreset): SkRuntimeEffect | null {
  if (effectCache.has(presetId)) {
    return effectCache.get(presetId) ?? null;
  }

  try {
    const lutData = generateLutFromPreset(preset);
    const source  = buildLutShaderSource(lutData, LUT_SIZE);
    const effect  = Skia.RuntimeEffect.Make(source);

    if (effect) {
      console.log(`[LutShaderCache] Compiled LUT shader for "${presetId}"`);
    } else {
      console.warn(`[LutShaderCache] Compilation returned null for "${presetId}" — will use film shader fallback`);
    }

    effectCache.set(presetId, effect ?? null);
    return effect ?? null;
  } catch (e) {
    console.warn(`[LutShaderCache] Exception building LUT for "${presetId}":`, e);
    effectCache.set(presetId, null);
    return null;
  }
}

/**
 * Evict all cached effects (call on low-memory warning).
 */
export function clearLutCache(): void {
  effectCache.clear();
}
