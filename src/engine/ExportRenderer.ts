import { Skia } from '@shopify/react-native-skia';
import type { SkImage } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';
import type { EditRecipe } from './EditRecipe';
import { buildColorMatrix } from './shaders/adjustments';
import { getPresetById } from './presets';
import { BUNDLED_STYLES, styleProfileToColorMatrix } from './StyleTransfer';

const IDENTITY = [1,0,0,0,0, 0,1,0,0,0, 0,0,1,0,0, 0,0,0,1,0];

function isIdentity(m: number[]): boolean {
  return m.every((v, i) => Math.abs(v - IDENTITY[i]) < 0.0001);
}

function multiplyMat(a: number[], b: number[]): number[] {
  const out = new Array(20).fill(0);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[row * 5 + k] * b[k * 5 + col];
      if (col === 4) sum += a[row * 5 + 4];
      out[row * 5 + col] = sum;
    }
  }
  return out;
}

/** Load source image into Skia. Tries fromURI first; falls back to expo-file-system base64. */
async function loadSkiaImage(uri: string): Promise<SkImage | null> {
  // Primary: Skia.Data.fromURI (works for file:// and remote URIs)
  try {
    const data = await Skia.Data.fromURI(uri);
    if (data) {
      const img = Skia.Image.MakeImageFromEncoded(data);
      if (img) return img;
    }
  } catch {}

  // Fallback: read as base64 via expo-file-system (reliable for content:// URIs on Android)
  try {
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const data = Skia.Data.fromBase64(base64);
    if (data) {
      const img = Skia.Image.MakeImageFromEncoded(data);
      if (img) return img;
    }
  } catch {}

  return null;
}

/**
 * Renders the edited image at full source resolution off-screen.
 *
 * Uses the original image pixels directly — vastly higher quality than
 * snapshotting the preview canvas (~800px wide).
 *
 * Applies: manual color matrix (exposure/contrast/temp/tint/sat/vibrance)
 *        + AI style matrix
 *        + preset channel color matrix
 *
 * Output is scaled to fit targetW×targetH without upscaling.
 * Returns null if loading or rendering fails (caller should fall back to preview snapshot).
 */
export async function renderFullResExport(
  imageUri: string,
  recipe: EditRecipe,
  targetW: number,
  targetH: number,
): Promise<SkImage | null> {
  try {
    const src = await loadSkiaImage(imageUri);
    if (!src) return null;

    const srcW = src.width();
    const srcH = src.height();

    // Fit within target size; never upscale.
    // targetW/targetH of 0 means "use source resolution" (Original export).
    const fitScale = (targetW > 0 && targetH > 0)
      ? Math.min(targetW / srcW, targetH / srcH)
      : 1.0;
    const scale = Math.min(fitScale, 1.0);

    const idealW = Math.max(1, Math.round(srcW * scale));
    const idealH = Math.max(1, Math.round(srcH * scale));

    // ── Build combined color matrix ──────────────────────────────────────
    // Order: manual adjustments → AI style → preset channel matrix
    let mat = buildColorMatrix(recipe);

    if (recipe.aiStyle?.modelId) {
      const style = BUNDLED_STYLES.find(s => s.id === recipe.aiStyle!.modelId);
      if (style) {
        const ai = styleProfileToColorMatrix(style.profile, recipe.aiStyle.intensity);
        if (!isIdentity(ai)) mat = multiplyMat(ai, mat);
      }
    }

    const preset = recipe.preset?.lutId ? (getPresetById(recipe.preset.lutId) ?? null) : null;
    if (preset && recipe.preset) {
      const t = recipe.preset.intensity / 100;
      const pm = preset.colorMatrix.map((v, i) => IDENTITY[i] + (v - IDENTITY[i]) * t);
      if (!isIdentity(pm)) mat = multiplyMat(pm, mat);
    }
    // ────────────────────────────────────────────────────────────────────

    // Create off-screen surface — tries ideal size, halves if OOM (low-end devices)
    let outW = idealW;
    let outH = idealH;
    let surface = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      surface = Skia.Surface.Make(outW, outH);
      if (surface) break;
      outW = Math.max(1, Math.round(outW * 0.5));
      outH = Math.max(1, Math.round(outH * 0.5));
    }
    if (!surface) return null;

    const canvas = surface.getCanvas();
    const paint = Skia.Paint();
    if (!isIdentity(mat)) {
      paint.setColorFilter(Skia.ColorFilter.MakeMatrix(mat));
    }
    canvas.drawImageRect(
      src,
      Skia.XYWHRect(0, 0, srcW, srcH),
      Skia.XYWHRect(0, 0, outW, outH),
      paint,
    );

    return surface.makeImageSnapshot();
  } catch {
    return null;
  }
}
