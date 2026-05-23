import * as FileSystem from 'expo-file-system/legacy';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import type { ExportFormat, ExportResolution } from '../store/exportStore';

export interface ExportOptions {
  format: ExportFormat;
  quality: number;
  resolution: ExportResolution;
  keepMetadata: boolean;
}

export function getResolutionDimensions(
  resolution: ExportResolution,
  originalWidth: number,
  originalHeight: number,
): { width: number; height: number } {
  switch (resolution) {
    case '4k':
      return scaleToFit(originalWidth, originalHeight, 3840, 2160);
    case '2k':
      return scaleToFit(originalWidth, originalHeight, 2560, 1440);
    case '1080p':
      return scaleToFit(originalWidth, originalHeight, 1920, 1080);
    case 'original':
    default:
      return { width: originalWidth, height: originalHeight };
  }
}

function scaleToFit(
  w: number, h: number, maxW: number, maxH: number,
): { width: number; height: number } {
  const scale = Math.min(maxW / w, maxH / h, 1);
  return { width: Math.round(w * scale), height: Math.round(h * scale) };
}

/**
 * Save a rendered image (as base64 data) to the device gallery.
 */
export async function saveToGallery(
  base64Data: string,
  format: ExportFormat,
): Promise<string> {
  const { status } = await MediaLibrary.requestPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Media library permission not granted');
  }

  const ext = format === 'png' ? 'png' : 'jpg';
  const filename = `RAWEye_${Date.now()}.${ext}`;
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, base64Data, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const asset = await MediaLibrary.createAssetAsync(fileUri);
  await FileSystem.deleteAsync(fileUri, { idempotent: true });

  return asset.uri;
}

/**
 * Share a rendered image via the system share sheet.
 */
export async function shareImage(
  base64Data: string,
  format: ExportFormat,
): Promise<void> {
  const ext = format === 'png' ? 'png' : 'jpg';
  const filename = `RAWEye_${Date.now()}.${ext}`;
  const fileUri = `${FileSystem.cacheDirectory}${filename}`;

  await FileSystem.writeAsStringAsync(fileUri, base64Data, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
  await Sharing.shareAsync(fileUri, { mimeType, dialogTitle: 'Share from RAW Eye' });

  await FileSystem.deleteAsync(fileUri, { idempotent: true });
}
