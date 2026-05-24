/**
 * UpscaleEngine — on-device 4× super-resolution via ESRGAN TFLite.
 *
 * Pipeline:
 *   URI → Skia image → downsample to ≤1080p → pad to tile multiples
 *   → slice into 50×50 tiles → ESRGAN inference (4× each tile)
 *   → stitch 200×200 outputs → crop to exact size → encode JPEG → URI
 */

import { loadTensorflowModel } from 'react-native-fast-tflite';
import type { TensorflowModel } from 'react-native-fast-tflite';
import { Skia, ColorType, AlphaType, ImageFormat } from '@shopify/react-native-skia';
import * as FileSystem from 'expo-file-system/legacy';

// ─── Constants ────────────────────────────────────────────────────────────────

const TILE_IN  = 50;   // ESRGAN input patch size
const SCALE    = 4;    // 4× super-resolution
const TILE_OUT = TILE_IN * SCALE; // 200
const MAX_INPUT_DIM = 1080; // long-edge cap before upscaling (perf vs quality)
const YIELD_EVERY   = 8;    // yield to UI thread every N tiles

// Model download fallback — tried in order when the bundled asset is unavailable
const MODEL_URLS = [
  // tensorflow/examples repo (same ESRGAN 50×50→200×200 model)
  'https://raw.githubusercontent.com/tensorflow/examples/master/lite/examples/super_resolution/android/app/src/main/assets/ESRGAN.tflite',
];
// Cached on first download — never re-downloaded unless cache is corrupt
const MODEL_CACHE = `${FileSystem.cacheDirectory}esrgan_model.tflite`;

// ─── Public types ─────────────────────────────────────────────────────────────

export type UpscalePhase =
  | 'downloading' // one-time model download (~6 MB)
  | 'loading'     // loading TFLite model into memory
  | 'resizing'    // preparing input image
  | 'processing'  // running tile inference
  | 'stitching'   // assembling output
  | 'saving'      // encoding + writing file
  | 'done';

export interface UpscaleProgress {
  phase: UpscalePhase;
  tile: number;
  totalTiles: number;
}

// ─── Internal helpers ─────────────────────────────────────────────────────────

async function loadSkiaImage(uri: string) {
  // Primary: fetch → ArrayBuffer → Skia (no base64 overhead)
  try {
    const res = await fetch(uri);
    if (res.ok) {
      const buf = await res.arrayBuffer();
      const data = Skia.Data.fromBytes(new Uint8Array(buf));
      if (data) {
        const img = Skia.Image.MakeImageFromEncoded(data);
        if (img) return img;
      }
    }
  } catch { /* fall through */ }

  // Fallback: expo-file-system base64
  try {
    const b64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    const data = Skia.Data.fromBase64(b64);
    if (data) {
      const img = Skia.Image.MakeImageFromEncoded(data);
      if (img) return img;
    }
  } catch { /* fall through */ }

  return null;
}

function clamp255(v: number): number {
  return v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
}

// ─── Main export ──────────────────────────────────────────────────────────────

/**
 * Upscales the image at `uri` by 4× using ESRGAN.
 * Returns the URI of the saved JPEG in the app cache directory.
 * Calls `onProgress` frequently so you can drive a progress bar.
 */
export async function upscaleImage(
  uri: string,
  onProgress: (p: UpscaleProgress) => void,
): Promise<string> {

  // ── 1. Load TFLite model (3-path fallback) ───────────────────────────────
  onProgress({ phase: 'loading', tile: 0, totalTiles: 0 });

  let model!: TensorflowModel;

  // Path A: bundled asset (CI successfully downloaded & embedded it)
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    model = await loadTensorflowModel(require('../../assets/models/esrgan.tflite'));
  } catch { /* not bundled — fall through */ }

  // Path B: previously cached download
  if (!model) {
    try {
      const info = await FileSystem.getInfoAsync(MODEL_CACHE);
      if (info.exists && (info as any).size > 1_000_000) {
        model = await loadTensorflowModel({ url: MODEL_CACHE });
      }
    } catch { /* cache corrupt — fall through */ }
  }

  // Path C: download from network, then cache for all future runs
  if (!model) {
    onProgress({ phase: 'downloading', tile: 0, totalTiles: 0 });
    let downloadOk = false;
    for (const url of MODEL_URLS) {
      try {
        const result = await FileSystem.downloadAsync(url, MODEL_CACHE);
        if (result.status === 200) {
          const info = await FileSystem.getInfoAsync(MODEL_CACHE);
          if (info.exists && (info as any).size > 1_000_000) {
            downloadOk = true;
            break;
          }
        }
      } catch { /* try next URL */ }
    }
    if (!downloadOk) {
      throw new Error(
        'Could not download the AI model (~6 MB). ' +
        'Please check your internet connection and try again.',
      );
    }
    onProgress({ phase: 'loading', tile: 0, totalTiles: 0 });
    try {
      model = await loadTensorflowModel({ url: MODEL_CACHE });
    } catch (e: any) {
      // Cache corrupt after download — delete so next attempt re-downloads
      await FileSystem.deleteAsync(MODEL_CACHE, { idempotent: true });
      throw new Error('Downloaded model failed to load. Try again.');
    }
  }

  try {

    // ── 2. Load source image ─────────────────────────────────────────────────
    onProgress({ phase: 'resizing', tile: 0, totalTiles: 0 });

    const srcImg = await loadSkiaImage(uri);
    if (!srcImg) throw new Error('Could not load image for upscaling.');

    const origW = srcImg.width();
    const origH = srcImg.height();

    // ── 3. Downsample to MAX_INPUT_DIM (long-edge) if necessary ──────────────
    const maxDim    = Math.max(origW, origH);
    const downScale = maxDim > MAX_INPUT_DIM ? MAX_INPUT_DIM / maxDim : 1.0;
    const procW     = Math.round(origW * downScale);
    const procH     = Math.round(origH * downScale);

    // ── 4. Pad to nearest TILE_IN multiple so tiles fit exactly ──────────────
    const paddedW = Math.ceil(procW / TILE_IN) * TILE_IN;
    const paddedH = Math.ceil(procH / TILE_IN) * TILE_IN;

    // ── 5. Draw downsampled image into padded surface ─────────────────────────
    const inSurface = Skia.Surface.Make(paddedW, paddedH);
    if (!inSurface) throw new Error('Could not create GPU surface for input.');
    const inCanvas = inSurface.getCanvas();
    inCanvas.drawImageRect(
      srcImg,
      Skia.XYWHRect(0, 0, origW, origH),
      Skia.XYWHRect(0, 0, procW, procH),
      Skia.Paint(),
    );
    const inSnap = inSurface.makeImageSnapshot();

    // ── 6. Read RGBA pixel data from the padded image ─────────────────────────
    const srcPixels = inSnap.readPixels(0, 0, {
      colorType: ColorType.RGBA_8888,
      alphaType: AlphaType.Unpremul,
      width: paddedW,
      height: paddedH,
    }) as Uint8Array | null;

    if (!srcPixels) throw new Error('Could not read pixel data from source image.');

    // ── 7. Prepare output buffer ──────────────────────────────────────────────
    const tilesX     = paddedW / TILE_IN;
    const tilesY     = paddedH / TILE_IN;
    const totalTiles = tilesX * tilesY;
    const outW       = paddedW * SCALE;
    const outH       = paddedH * SCALE;
    const outPixels  = new Uint8Array(outW * outH * 4);
    // Pre-fill alpha channel with 255 (opaque)
    for (let i = 3; i < outPixels.length; i += 4) outPixels[i] = 255;

    // Reuse tile input buffer across all tiles (avoid GC pressure)
    const tileInput = new Float32Array(TILE_IN * TILE_IN * 3);

    // ── 8. Tile inference loop ────────────────────────────────────────────────
    for (let ty = 0; ty < tilesY; ty++) {
      for (let tx = 0; tx < tilesX; tx++) {
        const tileIdx = ty * tilesX + tx;
        onProgress({ phase: 'processing', tile: tileIdx, totalTiles });

        // Extract 50×50 tile pixels → normalised float [0, 1] (RGB, no alpha)
        let k = 0;
        for (let py = 0; py < TILE_IN; py++) {
          for (let px = 0; px < TILE_IN; px++) {
            const srcIdx = ((ty * TILE_IN + py) * paddedW + (tx * TILE_IN + px)) * 4;
            tileInput[k++] = srcPixels[srcIdx]     / 255.0; // R
            tileInput[k++] = srcPixels[srcIdx + 1] / 255.0; // G
            tileInput[k++] = srcPixels[srcIdx + 2] / 255.0; // B
          }
        }

        // ESRGAN inference: [1, 50, 50, 3] → [1, 200, 200, 3]
        const outputs  = await model.run([tileInput]);
        const tileOut  = outputs[0] as Float32Array;

        // Write 200×200 output tile into outPixels at the correct position
        const offX = tx * TILE_OUT;
        const offY = ty * TILE_OUT;
        let j = 0;
        for (let py = 0; py < TILE_OUT; py++) {
          for (let px = 0; px < TILE_OUT; px++) {
            const dstIdx = ((offY + py) * outW + (offX + px)) * 4;
            outPixels[dstIdx]     = clamp255(tileOut[j++] * 255); // R
            outPixels[dstIdx + 1] = clamp255(tileOut[j++] * 255); // G
            outPixels[dstIdx + 2] = clamp255(tileOut[j++] * 255); // B
            // Alpha already set to 255 above
          }
        }

        // Yield to UI thread periodically so the progress bar can update
        if (tileIdx % YIELD_EVERY === 0) {
          await new Promise<void>(r => setTimeout(r, 0));
        }
      }
    }

    // ── 9. Crop output to exact size (remove tile-padding surplus) ────────────
    onProgress({ phase: 'stitching', tile: totalTiles, totalTiles });

    const finalW = procW * SCALE;
    const finalH = procH * SCALE;
    const finalPixels = new Uint8Array(finalW * finalH * 4);

    for (let y = 0; y < finalH; y++) {
      const srcRowOff = y * outW * 4;
      const dstRowOff = y * finalW * 4;
      finalPixels.set(outPixels.subarray(srcRowOff, srcRowOff + finalW * 4), dstRowOff);
    }

    // ── 10. Create Skia image from raw pixels ─────────────────────────────────
    const outImg = Skia.Image.MakeImage(
      {
        colorType: ColorType.RGBA_8888,
        alphaType: AlphaType.Unpremul,
        width: finalW,
        height: finalH,
      },
      finalPixels,
      finalW * 4,
    );
    if (!outImg) throw new Error('Could not assemble output image.');

    // ── 11. Encode and save ───────────────────────────────────────────────────
    onProgress({ phase: 'saving', tile: totalTiles, totalTiles });

    const b64  = outImg.encodeToBase64(ImageFormat.JPEG, 95);
    const dest = `${FileSystem.cacheDirectory}upscaled_${Date.now()}.jpg`;
    await FileSystem.writeAsStringAsync(dest, b64, {
      encoding: FileSystem.EncodingType.Base64,
    });

    onProgress({ phase: 'done', tile: totalTiles, totalTiles });
    return dest;

  } finally {
    model.destroy();
  }
}

/** Human-readable label for each phase shown in the progress UI. */
export function phaseLabel(phase: UpscalePhase): string {
  switch (phase) {
    case 'downloading': return 'Downloading AI model (~6 MB)…';
    case 'loading':     return 'Loading AI model…';
    case 'resizing':    return 'Preparing image…';
    case 'processing':  return 'Running super-resolution…';
    case 'stitching':   return 'Assembling output…';
    case 'saving':      return 'Saving…';
    case 'done':        return 'Done';
  }
}

/** Expected output dimensions given source dimensions. */
export function getOutputDimensions(w: number, h: number): { outW: number; outH: number } {
  const maxDim    = Math.max(w, h);
  const downScale = maxDim > MAX_INPUT_DIM ? MAX_INPUT_DIM / maxDim : 1.0;
  return {
    outW: Math.round(w * downScale) * SCALE,
    outH: Math.round(h * downScale) * SCALE,
  };
}
