/**
 * LutGenerator — bakes a FilmPreset into a 3D LUT at runtime.
 *
 * For each point (r, g, b) in a SIZE³ grid, applies:
 *   1. colorMatrix     — channel mixing / WB / exposure bias
 *   2. per-channel tone curves — blackPoint, whitePoint, S-curve
 *   3. saturationBoost — global saturation multiplier
 *   4. split tone      — luminance-based shadow/highlight tinting
 *
 * The output Float32Array can be used directly or converted to a
 * SKSL constant array via lutDataToSkslConst().
 */

import type { FilmPreset, ToneCurve } from './presets/FilmPreset';

/** Side length of the 3D LUT cube. 9³ = 729 points — good quality, low memory. */
export const LUT_SIZE = 9;

// ─── Color helpers ───────────────────────────────────────────────────────────

function clamp(x: number, lo = 0, hi = 1) {
  return x < lo ? lo : x > hi ? hi : x;
}

function applyCurve(x: number, c: ToneCurve): number {
  // Map into [blackPoint, whitePoint]
  let y = c.blackPoint + x * (c.whitePoint - c.blackPoint);

  // S-curve around midtonePivot
  const s = (c.shadowContrast - 0.5) * 2.8;
  if (Math.abs(s) > 0.002) {
    const p = c.midtonePivot;
    const norm = (y - p) / 0.5;
    const tanhS = Math.tanh(Math.abs(s));
    y = p + 0.5 * Math.tanh(s * norm) / tanhS;
  }

  // Highlight rolloff shoulder (softens above ~0.75)
  if (c.highlightRolloff < 0.5 && y > 0.72) {
    const excess = y - 0.72;
    y = 0.72 + excess * (c.highlightRolloff * 1.6);
  }

  return clamp(y);
}

function applyColorMatrix(r: number, g: number, b: number, m: number[]): [number, number, number] {
  return [
    clamp(m[0]*r + m[1]*g + m[2]*b + m[4]),
    clamp(m[5]*r + m[6]*g + m[7]*b + m[9]),
    clamp(m[10]*r + m[11]*g + m[12]*b + m[14]),
  ];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r)      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else                h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  if (s === 0) return [l, l, l];
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2 = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  return [hue2(h + 1/3), hue2(h), hue2(h - 1/3)];
}

// ─── Main generator ──────────────────────────────────────────────────────────

/**
 * Generate a SIZE³ LUT from a FilmPreset.
 * Returns a Float32Array of (SIZE³ × 3) RGB values in .cube order:
 * R varies fastest, B varies slowest (standard .cube scan order).
 */
export function generateLutFromPreset(preset: FilmPreset): Float32Array {
  const N = LUT_SIZE;
  const data = new Float32Array(N * N * N * 3);
  let idx = 0;

  for (let bi = 0; bi < N; bi++) {
    for (let gi = 0; gi < N; gi++) {
      for (let ri = 0; ri < N; ri++) {
        let r = ri / (N - 1);
        let g = gi / (N - 1);
        let b = bi / (N - 1);

        // 1. Color matrix
        [r, g, b] = applyColorMatrix(r, g, b, preset.colorMatrix);

        // 2. Tone curves — master first, then per-channel
        r = applyCurve(applyCurve(r, preset.toneCurves.master), preset.toneCurves.red);
        g = applyCurve(applyCurve(g, preset.toneCurves.master), preset.toneCurves.green);
        b = applyCurve(applyCurve(b, preset.toneCurves.master), preset.toneCurves.blue);

        // 3. Saturation boost
        const sat = preset.saturationBoost;
        if (Math.abs(sat - 1) > 0.005) {
          const [h, s, l] = rgbToHsl(r, g, b);
          [r, g, b] = hslToRgb(h, clamp(s * sat), l);
        }

        // 4. Vibrance (selective sat — boosts low-sat colors more)
        const vib = preset.vibranceBoost;
        if (Math.abs(vib - 1) > 0.005) {
          const [h, s, l] = rgbToHsl(r, g, b);
          // Vibrance: weaker boost on already-saturated pixels
          const vibBoost = 1 + (vib - 1) * (1 - s);
          [r, g, b] = hslToRgb(h, clamp(s * vibBoost), l);
        }

        // 5. Split tone
        const st = preset.splitTone;
        if (st.shadowSaturation > 0.005 || st.highlightSaturation > 0.005) {
          const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
          const shadowW = clamp(1 - lum * 2.5) * st.shadowSaturation * 0.6;
          const hlW     = clamp(lum * 2.5 - 1.5) * st.highlightSaturation * 0.6;

          if (shadowW > 0.001) {
            const tH = st.shadowHue / 360;
            const [h, s, l] = rgbToHsl(r, g, b);
            const nh = h + (tH - h) * shadowW;
            const ns = clamp(s + shadowW * 0.4);
            [r, g, b] = hslToRgb(nh, ns, l);
          }
          if (hlW > 0.001) {
            const tH = st.highlightHue / 360;
            const [h, s, l] = rgbToHsl(r, g, b);
            const nh = h + (tH - h) * hlW;
            const ns = clamp(s + hlW * 0.3);
            [r, g, b] = hslToRgb(nh, ns, l);
          }
        }

        data[idx++] = clamp(r);
        data[idx++] = clamp(g);
        data[idx++] = clamp(b);
      }
    }
  }

  return data;
}

/**
 * Format the LUT Float32Array as a SKSL half3 array literal string.
 * Used to bake the LUT directly into the shader source.
 * Each value is rounded to 4 decimal places to keep the string compact.
 */
export function lutDataToSkslConst(data: Float32Array, size: number): string {
  const total = size * size * size;
  const entries: string[] = [];
  for (let i = 0; i < total; i++) {
    const r = data[i * 3    ].toFixed(4);
    const g = data[i * 3 + 1].toFixed(4);
    const b = data[i * 3 + 2].toFixed(4);
    entries.push(`half3(${r},${g},${b})`);
  }
  return `half3 lut[${total}] = half3[](${entries.join(',')});`;
}

/**
 * Serialise a preset LUT to .cube text format.
 * Can be saved and used in any LUT-compatible software.
 */
export function lutDataToCube(data: Float32Array, size: number, presetName: string): string {
  const lines: string[] = [
    `TITLE "${presetName}"`,
    `LUT_3D_SIZE ${size}`,
    `DOMAIN_MIN 0.0 0.0 0.0`,
    `DOMAIN_MAX 1.0 1.0 1.0`,
    '',
  ];
  const total = size * size * size;
  for (let i = 0; i < total; i++) {
    const r = data[i * 3    ].toFixed(6);
    const g = data[i * 3 + 1].toFixed(6);
    const b = data[i * 3 + 2].toFixed(6);
    lines.push(`${r} ${g} ${b}`);
  }
  return lines.join('\n');
}
