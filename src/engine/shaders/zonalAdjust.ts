import { Skia } from '@shopify/react-native-skia';

/**
 * Luminance-zone-aware adjustment shader.
 * Photographers expect:
 * - "Highlights" affects only bright areas
 * - "Shadows" affects only dark areas
 * - "Whites" affects the very brightest
 * - "Blacks" affects the very darkest
 *
 * This uses smooth luminance masks with proper zone separation.
 * Based on Ansel Adams Zone System mapped to digital:
 * - Blacks: Zone 0-II (0.0 - 0.15)
 * - Shadows: Zone II-IV (0.15 - 0.40)
 * - Midtones: Zone IV-VI (0.40 - 0.60)
 * - Highlights: Zone VI-VIII (0.60 - 0.85)
 * - Whites: Zone VIII-X (0.85 - 1.0)
 */
export const ZONAL_ADJUST_SKSL = `
uniform shader image;
uniform float2 resolution;
uniform half highlights;   // -1 to +1
uniform half shadows;      // -1 to +1
uniform half whites;       // -1 to +1
uniform half blacks;       // -1 to +1

half4 main(float2 coord) {
  half4 color = image.eval(coord);

  // Compute luminance
  half lum = dot(color.rgb, half3(0.2126, 0.7152, 0.0722));

  // Zone masks (smooth, overlapping for natural transitions)
  half blacksMask = 1.0 - smoothstep(0.0, 0.20, lum);       // Darkest
  half shadowsMask = smoothstep(0.0, 0.15, lum) * (1.0 - smoothstep(0.30, 0.55, lum));  // Dark
  half highlightsMask = smoothstep(0.45, 0.70, lum) * (1.0 - smoothstep(0.85, 1.0, lum));  // Bright
  half whitesMask = smoothstep(0.80, 1.0, lum);              // Brightest

  // Compute adjustment per zone
  // Positive = brighten zone, Negative = darken zone
  half adjustment = 0.0;
  adjustment += blacks * blacksMask * 0.3;
  adjustment += shadows * shadowsMask * 0.4;
  adjustment += highlights * highlightsMask * 0.4;
  adjustment += whites * whitesMask * 0.3;

  // Apply adjustment preserving color ratios (avoid hue shifts)
  half3 adjusted;
  if (lum > 0.001) {
    half targetLum = clamp(lum + adjustment, 0.0, 1.0);
    half ratio = targetLum / lum;
    adjusted = color.rgb * ratio;
  } else {
    // Near-black: just add
    adjusted = color.rgb + half3(adjustment);
  }

  adjusted = clamp(adjusted, half3(0.0), half3(1.0));
  return half4(adjusted, color.a);
}
`;

export let zonalAdjustShader: ReturnType<typeof Skia.RuntimeEffect.Make> = null;
try {
  zonalAdjustShader = Skia.RuntimeEffect.Make(ZONAL_ADJUST_SKSL);
} catch (e) {
  console.warn('[Shader] Zonal adjust shader failed to compile:', e);
}
