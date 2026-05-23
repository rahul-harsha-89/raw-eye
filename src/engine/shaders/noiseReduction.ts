import { Skia } from '@shopify/react-native-skia';

/**
 * Bilateral blur noise reduction shader.
 * Preserves edges while smoothing noise.
 * Two components:
 * - Luminance NR: smooths brightness noise (most visible)
 * - Color NR: smooths chroma noise (colored speckles)
 *
 * Technique: 5x5 kernel, weighted by spatial distance AND color similarity.
 * Edge-aware: pixels with very different colors get low weight → edges preserved.
 */
export const NOISE_REDUCTION_SKSL = `
uniform shader image;
uniform float2 resolution;
uniform half nrLuminance;   // 0-1 intensity
uniform half nrColor;       // 0-1 intensity

half4 main(float2 coord) {
  half4 center = image.eval(coord);

  if (nrLuminance < 0.01 && nrColor < 0.01) return center;

  float2 texel = 1.0 / resolution;

  // Bilateral filter parameters
  half sigmaSpatial = 2.0;
  half sigmaLum = 0.08 + nrLuminance * 0.12;    // Wider range = more blur
  half sigmaColor = 0.06 + nrColor * 0.14;

  half3 sumLum = half3(0.0);
  half3 sumColor = half3(0.0);
  half weightLum = 0.0;
  half weightColor = 0.0;

  half centerLum = dot(center.rgb, half3(0.2126, 0.7152, 0.0722));

  // 5x5 kernel (optimized: skip corners for performance)
  for (int y = -2; y <= 2; y++) {
    for (int x = -2; x <= 2; x++) {
      // Skip far corners for performance (circular-ish kernel)
      if (abs(x) == 2 && abs(y) == 2) continue;

      float2 offset = float2(float(x), float(y)) * texel;
      half4 sample = image.eval(coord + offset);
      half sampleLum = dot(sample.rgb, half3(0.2126, 0.7152, 0.0722));

      // Spatial weight (Gaussian)
      half dist = half(length(float2(float(x), float(y))));
      half spatialW = exp(-dist * dist / (2.0 * sigmaSpatial * sigmaSpatial));

      // Luminance similarity weight
      half lumDiff = abs(sampleLum - centerLum);
      half lumW = exp(-lumDiff * lumDiff / (2.0 * sigmaLum * sigmaLum));

      // Color similarity weight
      half3 colorDiff = abs(sample.rgb - center.rgb);
      half colorDist = length(colorDiff);
      half colorW = exp(-colorDist * colorDist / (2.0 * sigmaColor * sigmaColor));

      // Accumulate
      half wL = spatialW * lumW;
      half wC = spatialW * colorW;

      sumLum += sample.rgb * wL;
      sumColor += sample.rgb * wC;
      weightLum += wL;
      weightColor += wC;
    }
  }

  half3 filteredLum = sumLum / max(weightLum, 0.001);
  half3 filteredColor = sumColor / max(weightColor, 0.001);

  // Apply luminance NR: blend luminance channel only (preserve color)
  half3 result = center.rgb;
  if (nrLuminance > 0.01) {
    half origLum = dot(result, half3(0.2126, 0.7152, 0.0722));
    half newLum = dot(filteredLum, half3(0.2126, 0.7152, 0.0722));
    half blendedLum = mix(origLum, newLum, nrLuminance);
    if (origLum > 0.001) {
      result *= blendedLum / origLum;
    }
  }

  // Apply color NR: blend chrominance only (preserve luminance)
  if (nrColor > 0.01) {
    half lumBefore = dot(result, half3(0.2126, 0.7152, 0.0722));
    result = mix(result, filteredColor, nrColor * 0.7);
    // Restore original luminance
    half lumAfter = dot(result, half3(0.2126, 0.7152, 0.0722));
    if (lumAfter > 0.001) {
      result *= lumBefore / lumAfter;
    }
  }

  result = clamp(result, half3(0.0), half3(1.0));
  return half4(result, center.a);
}
`;

export let noiseReductionShader: ReturnType<typeof Skia.RuntimeEffect.Make> = null;
try {
  noiseReductionShader = Skia.RuntimeEffect.Make(NOISE_REDUCTION_SKSL);
} catch (e) {
  console.warn('[Shader] Noise reduction shader failed to compile:', e);
}
