/**
 * LUT Parser — reads .cube files and converts them to a flat Float32Array
 * for use as a lookup table texture in the shader pipeline.
 *
 * .cube format:
 *   TITLE "name"
 *   LUT_3D_SIZE N
 *   <r> <g> <b>  (one line per entry, N^3 total lines)
 */

export interface ParsedLut {
  title: string;
  size: number;
  data: Float32Array;
}

export function parseCubeFile(content: string): ParsedLut {
  const lines = content.split('\n');
  let title = 'Untitled';
  let size = 0;
  const values: number[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    if (trimmed === '' || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('TITLE')) {
      title = trimmed.replace(/^TITLE\s*"?/, '').replace(/"?\s*$/, '');
      continue;
    }

    if (trimmed.startsWith('LUT_3D_SIZE')) {
      size = parseInt(trimmed.split(/\s+/)[1], 10);
      continue;
    }

    if (trimmed.startsWith('DOMAIN_MIN') || trimmed.startsWith('DOMAIN_MAX')) {
      continue;
    }

    const parts = trimmed.split(/\s+/);
    if (parts.length >= 3) {
      const r = parseFloat(parts[0]);
      const g = parseFloat(parts[1]);
      const b = parseFloat(parts[2]);
      if (!isNaN(r) && !isNaN(g) && !isNaN(b)) {
        values.push(r, g, b);
      }
    }
  }

  if (size === 0) {
    size = Math.round(Math.cbrt(values.length / 3));
  }

  return {
    title,
    size,
    data: new Float32Array(values),
  };
}

/**
 * Apply a 3D LUT to an RGBA pixel.
 * Used for CPU-based LUT application (export path).
 */
export function applyLut(
  r: number, g: number, b: number,
  lut: ParsedLut,
  intensity: number,
): [number, number, number] {
  const s = lut.size - 1;
  const ri = r * s;
  const gi = g * s;
  const bi = b * s;

  const r0 = Math.min(Math.floor(ri), s);
  const g0 = Math.min(Math.floor(gi), s);
  const b0 = Math.min(Math.floor(bi), s);

  const idx = (b0 * lut.size * lut.size + g0 * lut.size + r0) * 3;

  const lr = lut.data[idx] ?? r;
  const lg = lut.data[idx + 1] ?? g;
  const lb = lut.data[idx + 2] ?? b;

  const t = intensity / 100;
  return [
    r + (lr - r) * t,
    g + (lg - g) * t,
    b + (lb - b) * t,
  ];
}
