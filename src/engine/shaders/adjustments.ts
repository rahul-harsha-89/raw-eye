import { Skia } from '@shopify/react-native-skia';
import type { EditRecipe } from '../EditRecipe';

export function buildColorMatrix(recipe: EditRecipe): number[] {
  let matrix = identity();

  // Note: highlights/shadows/whites/blacks are handled by zonalAdjust shader
  // (luminance-zone-aware, not possible with linear matrix)
  matrix = multiply(matrix, exposureMatrix(recipe.light.exposure));
  matrix = multiply(matrix, contrastMatrix(recipe.light.contrast / 100));
  matrix = multiply(matrix, temperatureMatrix(recipe.color.temperature / 100));
  matrix = multiply(matrix, tintMatrix(recipe.color.tint / 100));
  matrix = multiply(matrix, saturationMatrix(1 + recipe.color.saturation / 100));
  matrix = multiply(matrix, vibranceMatrix(recipe.color.vibrance / 100));

  return matrix;
}

function identity(): number[] {
  return [
    1, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

function multiply(a: number[], b: number[]): number[] {
  const result = new Array(20).fill(0);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[row * 5 + k] * b[k * 5 + col];
      }
      if (col === 4) {
        sum += a[row * 5 + 4];
      }
      result[row * 5 + col] = sum;
    }
  }
  return result;
}

function exposureMatrix(ev: number): number[] {
  const factor = Math.pow(2, ev);
  return [
    factor, 0, 0, 0, 0,
    0, factor, 0, 0, 0,
    0, 0, factor, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

function contrastMatrix(amount: number): number[] {
  const t = 0.5 * (1 - (1 + amount));
  const s = 1 + amount;
  return [
    s, 0, 0, 0, t,
    0, s, 0, 0, t,
    0, 0, s, 0, t,
    0, 0, 0, 1, 0,
  ];
}

function brightnessMatrix(
  highlights: number,
  shadows: number,
  whites: number,
  blacks: number,
): number[] {
  const hFactor = highlights / 200;
  const sFactor = shadows / 200;
  const wFactor = whites / 400;
  const bFactor = blacks / 400;
  const offset = sFactor + bFactor;
  const scale = 1 + hFactor + wFactor;
  return [
    scale, 0, 0, 0, offset,
    0, scale, 0, 0, offset,
    0, 0, scale, 0, offset,
    0, 0, 0, 1, 0,
  ];
}

function temperatureMatrix(amount: number): number[] {
  return [
    1 + amount * 0.2, 0, 0, 0, 0,
    0, 1, 0, 0, 0,
    0, 0, 1 - amount * 0.2, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

function tintMatrix(amount: number): number[] {
  return [
    1, 0, 0, 0, 0,
    0, 1 + amount * 0.15, 0, 0, 0,
    0, 0, 1, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

function saturationMatrix(s: number): number[] {
  const lr = 0.2126;
  const lg = 0.7152;
  const lb = 0.0722;
  const sr = (1 - s) * lr;
  const sg = (1 - s) * lg;
  const sb = (1 - s) * lb;
  return [
    sr + s, sg, sb, 0, 0,
    sr, sg + s, sb, 0, 0,
    sr, sg, sb + s, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

/**
 * Vibrance as a color matrix approximation.
 * True vibrance is non-linear (boosts less-saturated pixels more),
 * which can't be done in a linear matrix. We approximate by:
 * - Using a weaker saturation boost (since the film shader handles
 *   proper per-pixel vibrance via SKSL)
 * - Biasing toward red/blue channels (protects skin tones which are
 *   typically in orange/yellow — already saturated)
 */
function vibranceMatrix(amount: number): number[] {
  // Gentler than raw saturation — let the SKSL shader do the heavy lifting
  const boost = 1 + amount * 0.15;
  const lr = 0.2126;
  const lg = 0.7152;
  const lb = 0.0722;
  // Slightly favor R and B channels (skin is in orange = R+G, so less boost there)
  const rBoost = boost + amount * 0.05;
  const gBoost = boost - amount * 0.03; // Less green boost protects skin
  const bBoost = boost + amount * 0.04;
  const sr_r = (1 - rBoost) * lr;
  const sg_r = (1 - rBoost) * lg;
  const sb_r = (1 - rBoost) * lb;
  const sr_g = (1 - gBoost) * lr;
  const sg_g = (1 - gBoost) * lg;
  const sb_g = (1 - gBoost) * lb;
  const sr_b = (1 - bBoost) * lr;
  const sg_b = (1 - bBoost) * lg;
  const sb_b = (1 - bBoost) * lb;
  return [
    sr_r + rBoost, sg_r, sb_r, 0, 0,
    sr_g, sg_g + gBoost, sb_g, 0, 0,
    sr_b, sg_b, sb_b + bBoost, 0, 0,
    0, 0, 0, 1, 0,
  ];
}

export let vignetteShader: ReturnType<typeof Skia.RuntimeEffect.Make> = null;
try {
  vignetteShader = Skia.RuntimeEffect.Make(`
    uniform shader image;
    uniform float2 resolution;
    uniform float intensity;

    half4 main(float2 coord) {
      half4 color = image.eval(coord);
      float2 uv = coord / resolution;
      float2 center = float2(0.5, 0.5);
      float dist = distance(uv, center);
      float vignette = smoothstep(0.8, 0.2, dist * (1.0 + intensity * 0.01));
      if (intensity > 0.0) {
        color.rgb *= vignette;
      } else {
        color.rgb *= mix(1.0, 1.0 / max(vignette, 0.01), -intensity * 0.01);
      }
      return color;
    }
  `);
} catch (e) {
  console.warn('[Shader] Vignette shader failed to compile:', e);
}

export let sharpenShader: ReturnType<typeof Skia.RuntimeEffect.Make> = null;
try {
  sharpenShader = Skia.RuntimeEffect.Make(`
  uniform shader image;
  uniform float2 resolution;
  uniform float amount;

  half4 main(float2 coord) {
    float2 texel = 1.0 / resolution;
    half4 center = image.eval(coord);
    half4 top    = image.eval(coord + float2(0, -texel.y));
    half4 bottom = image.eval(coord + float2(0,  texel.y));
    half4 left   = image.eval(coord + float2(-texel.x, 0));
    half4 right  = image.eval(coord + float2( texel.x, 0));
    half4 sharpened = center * (1.0 + 4.0 * amount * 0.01) - (top + bottom + left + right) * amount * 0.01;
    return half4(clamp(sharpened.rgb, half3(0.0), half3(1.0)), center.a);
  }
`);
} catch (e) {
  console.warn('[Shader] Sharpen shader failed to compile:', e);
}
