import { Dimensions, PixelRatio } from 'react-native';

export interface DeviceProfile {
  screenWidth: number;
  screenHeight: number;
  pixelRatio: number;
  /** Max preview dimension (based on screen size + pixel ratio) */
  maxPreviewSize: number;
  /** Max texture size to use for export (conservative GPU limit) */
  maxTextureSize: number;
  /** Whether device is considered low-end (< 3GB estimated RAM) */
  isLowEnd: boolean;
}

/**
 * Get device capabilities for adaptive quality settings.
 * Note: React Native doesn't expose exact RAM — we estimate based on pixel ratio.
 * Devices with pixelRatio < 2.5 are treated as budget devices.
 */
export function getDeviceProfile(): DeviceProfile {
  const { width, height } = Dimensions.get('window');
  const pixelRatio = PixelRatio.get();

  // Screen pixel dimensions
  const screenWidth = Math.round(width * pixelRatio);
  const screenHeight = Math.round(height * pixelRatio);

  // Preview: render at screen resolution (no need for bigger)
  const maxPreviewSize = Math.max(screenWidth, screenHeight);

  // Export texture limit: most modern Android GPUs handle 4096.
  // Budget devices (low pixel ratio) get 2048 to avoid OOM.
  const isLowEnd = pixelRatio < 2.5;
  const maxTextureSize = isLowEnd ? 2048 : 4096;

  return {
    screenWidth,
    screenHeight,
    pixelRatio,
    maxPreviewSize,
    maxTextureSize,
    isLowEnd,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Export resolution options — device-aware
// ─────────────────────────────────────────────────────────────────────────────

export interface ExportResolutionOption {
  key: string;
  /** Short label shown on chip, e.g. "Full Size" */
  label: string;
  /** MP badge shown below label, e.g. "12.3 MP · 4000×3000" */
  badge: string;
  targetWidth: number;
  targetHeight: number;
  /** Greyed-out when true */
  disabled: boolean;
  /** Tooltip shown when disabled */
  disabledReason?: string;
}

/**
 * Build export resolution options tailored to the source image and this device.
 * Returns 2–4 options; GPU-unsafe ones are disabled rather than hidden.
 */
export function getExportResolutionOptions(
  imageWidth: number,
  imageHeight: number,
): ExportResolutionOption[] {
  const profile = getDeviceProfile();

  // Candidates: (key, label, scale)
  const candidates: Array<{ key: string; label: string; scale: number }> = [
    { key: 'full',    label: 'Full Size', scale: 1.00 },
    { key: 'large',   label: 'Large',    scale: 0.75 },
    { key: 'medium',  label: 'Medium',   scale: 0.50 },
    { key: 'small',   label: 'Small',    scale: 0.25 },
  ];

  const options: ExportResolutionOption[] = [];

  for (const c of candidates) {
    const w = Math.round(imageWidth  * c.scale);
    const h = Math.round(imageHeight * c.scale);
    const mp = (w * h) / 1_000_000;

    // Skip tiny outputs (< 0.3 MP) — not useful as distinct options
    if (w > 0 && mp < 0.3) continue;

    // Skip scaled-up options (image is already smaller than this scale)
    if (c.scale > 1) continue;

    const exceedsGpu = Math.max(w, h) > profile.maxTextureSize;
    const badge = w > 0
      ? `${mp.toFixed(1)} MP  ·  ${w}×${h}`
      : 'Matches source';

    options.push({
      key: c.key,
      label: c.label,
      badge,
      targetWidth: w,
      targetHeight: h,
      disabled: exceedsGpu,
      disabledReason: exceedsGpu
        ? `Exceeds GPU limit on this device (max ${profile.maxTextureSize}px)`
        : undefined,
    });
  }

  // Always have at least one enabled option — if all are disabled, enable medium
  const hasEnabled = options.some((o) => !o.disabled);
  if (!hasEnabled && options.length > 0) {
    const med = options.find((o) => o.key === 'medium');
    if (med) med.disabled = false;
  }

  return options;
}

/**
 * Calculate optimal preview dimensions that fit within maxPreviewSize
 * while maintaining aspect ratio.
 */
export function getPreviewDimensions(
  originalWidth: number,
  originalHeight: number,
  maxSize?: number,
): { width: number; height: number } {
  const profile = getDeviceProfile();
  const limit = maxSize ?? profile.maxPreviewSize;

  if (originalWidth <= limit && originalHeight <= limit) {
    return { width: originalWidth, height: originalHeight };
  }

  const scale = Math.min(limit / originalWidth, limit / originalHeight);
  return {
    width: Math.round(originalWidth * scale),
    height: Math.round(originalHeight * scale),
  };
}
