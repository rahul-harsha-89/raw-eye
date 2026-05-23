export interface PresetMeta {
  id: string;
  name: string;
  category: string;
  description: string;
}

/**
 * Built-in preset registry.
 * In the MVP, LUTs are generated programmatically (no .cube files bundled yet).
 * When .cube files are added quarterly, this registry maps IDs to file paths.
 */
export const BUILTIN_PRESETS: PresetMeta[] = [
  { id: 'tokyo-night', name: 'Tokyo Night', category: 'Cinematic', description: 'Cool blue shadows, warm highlights' },
  { id: 'soft-film', name: 'Soft Film', category: 'Film', description: 'Faded blacks, gentle warm tone' },
  { id: 'desert-warmth', name: 'Desert Warmth', category: 'Warm', description: 'Golden tones, lifted shadows' },
  { id: 'hc-mono', name: 'HC Mono', category: 'B&W', description: 'High contrast black and white' },
  { id: 'forest-green', name: 'Forest Green', category: 'Nature', description: 'Rich greens, muted reds' },
  { id: 'portra-400', name: 'Portra 400', category: 'Film', description: 'Classic portrait film emulation' },
];

/**
 * Generates a color matrix that simulates a LUT preset.
 * This is used until real .cube LUT files are bundled.
 * Each preset returns a 20-element color matrix (same format as Skia ColorMatrix).
 */
export function getPresetColorMatrix(presetId: string): number[] {
  switch (presetId) {
    case 'tokyo-night':
      return [
        0.9, 0, 0.1, 0, -0.02,
        0, 0.85, 0.05, 0, 0,
        0.05, 0.1, 1.1, 0, 0.03,
        0, 0, 0, 1, 0,
      ];
    case 'soft-film':
      return [
        1.05, 0.05, 0, 0, 0.03,
        0.02, 1.0, 0.02, 0, 0.02,
        0, 0.02, 0.95, 0, 0.04,
        0, 0, 0, 1, 0,
      ];
    case 'desert-warmth':
      return [
        1.15, 0.05, 0, 0, 0.02,
        0, 1.05, 0, 0, 0.01,
        0, 0, 0.85, 0, 0,
        0, 0, 0, 1, 0,
      ];
    case 'hc-mono':
      return [
        0.33, 0.59, 0.11, 0, -0.05,
        0.33, 0.59, 0.11, 0, -0.05,
        0.33, 0.59, 0.11, 0, -0.05,
        0, 0, 0, 1, 0,
      ];
    case 'forest-green':
      return [
        0.9, 0, 0, 0, 0,
        0, 1.15, 0, 0, 0,
        0, 0.05, 0.9, 0, 0,
        0, 0, 0, 1, 0,
      ];
    case 'portra-400':
      return [
        1.05, 0.03, 0, 0, 0.01,
        0, 1.02, 0.02, 0, 0.01,
        0, 0, 0.95, 0, 0.03,
        0, 0, 0, 1, 0,
      ];
    default:
      return [
        1, 0, 0, 0, 0,
        0, 1, 0, 0, 0,
        0, 0, 1, 0, 0,
        0, 0, 0, 1, 0,
      ];
  }
}
