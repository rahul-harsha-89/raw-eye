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

/** Load source image into Skia.
 *  Primary: fetch → arrayBuffer → fromBytes (works for file://, content://, http://)
 *  Fallback: expo-file-system base64 (last resort for stubborn content:// URIs)
 */
async function loadSkiaImage(uri: string): Promise<SkImage | null> {
  // Primary: fetch API handles all Android URI schemes reliably
  try {
    const response = await fetch(uri);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      const data = Skia.Data.fromBytes(bytes);
      if (data) {
        const img = Skia.Image.MakeImageFromEncoded(data);
        if (img) return img;
      }
    }
  } catch {}

  // Fallback: expo-file-system base64 (reliable for content:// URIs that fetch may not handle)
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

    // Create off-screen surface.
    // If ideal size fails (GPU OOM), fall back to max-4096-long-edge — never below that.
    // Avoids the old binary-halving loop that could silently produce 768×882 from a 43MP source.
    let outW = idealW;
    let outH = idealH;
    let surface = Skia.Surface.Make(outW, outH);
    if (!surface) {
      const MAX_SAFE = 4096;
      const s = Math.min(MAX_SAFE / outW, MAX_SAFE / outH, 1.0);
      outW = Math.max(1, Math.round(outW * s));
      outH = Math.max(1, Math.round(outH * s));
      surface = Skia.Surface.Make(outW, outH);
    }
    if (!surface) return null;

    // Determine source region — apply crop if set (normalised 0–1 relative to source)
    const cr = recipe.geometry.cropRect;
    const srcRect = cr
      ? Skia.XYWHRect(cr.x * srcW, cr.y * srcH, cr.width * srcW, cr.height * srcH)
      : Skia.XYWHRect(0, 0, srcW, srcH);

    // When crop is active, re-derive output dims from cropped aspect ratio
    if (cr) {
      const cropSrcW = cr.width * srcW;
      const cropSrcH = cr.height * srcH;
      const cropFitScale = (targetW > 0 && targetH > 0)
        ? Math.min(targetW / cropSrcW, targetH / cropSrcH)
        : 1.0;
      const cropScale = Math.min(cropFitScale, 1.0);
      outW = Math.max(1, Math.round(cropSrcW * cropScale));
      outH = Math.max(1, Math.round(cropSrcH * cropScale));
      // Recreate surface with correct crop dimensions.
      // Same OOM guard as the main path — single scale to max-4096-long-edge.
      surface = Skia.Surface.Make(outW, outH);
      if (!surface) {
        const MAX_SAFE = 4096;
        const s = Math.min(MAX_SAFE / outW, MAX_SAFE / outH, 1.0);
        outW = Math.max(1, Math.round(outW * s));
        outH = Math.max(1, Math.round(outH * s));
        surface = Skia.Surface.Make(outW, outH);
      }
      if (!surface) return null;
    }

    const canvas = surface.getCanvas();
    const paint = Skia.Paint();
    if (!isIdentity(mat)) {
      paint.setColorFilter(Skia.ColorFilter.MakeMatrix(mat));
    }
    canvas.drawImageRect(
      src,
      srcRect,
      Skia.XYWHRect(0, 0, outW, outH),
      paint,
    );

    return surface.makeImageSnapshot();
  } catch {
    return null;
  }
}
