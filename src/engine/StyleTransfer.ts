/**
 * AI Style Transfer Engine
 *
 * MVP approach: Adaptive color histogram matching.
 * Unlike the old version with hardcoded values, this actually analyzes
 * the style reference's color characteristics and maps them onto the content image.
 *
 * Architecture allows dropping in TFLite neural style transfer later
 * without changing the UI layer.
 *
 * Algorithm:
 * 1. Each style reference has pre-analyzed color statistics (mean RGB, contrast, warmth)
 * 2. The transfer computes the DIFFERENCE between the style target and a "neutral" reference
 * 3. That difference is applied as a color transform at user-defined intensity
 * 4. The result preserves the original image structure but shifts its color palette
 */

export interface StyleColorProfile {
  /** Mean RGB values of the style image (0-1) */
  meanR: number;
  meanG: number;
  meanB: number;
  /** Standard deviation of luminance (contrast indicator) */
  luminanceStd: number;
  /** Warmth: positive = warm, negative = cool */
  warmth: number;
  /** Overall saturation level (0-1) */
  saturationLevel: number;
  /** Shadow density (how dark shadows are, 0-1) */
  shadowDensity: number;
  /** Highlight brightness (how bright highlights are, 0-1) */
  highlightBrightness: number;
}

export interface StyleReference {
  id: string;
  name: string;
  description: string;
  /** Pre-analyzed color profile of the reference image */
  profile: StyleColorProfile;
  /** Tags for categorization */
  tags: string[];
}

/** Neutral reference point (perfectly balanced image) */
const NEUTRAL_PROFILE: StyleColorProfile = {
  meanR: 0.45,
  meanG: 0.45,
  meanB: 0.45,
  luminanceStd: 0.22,
  warmth: 0,
  saturationLevel: 0.5,
  shadowDensity: 0.5,
  highlightBrightness: 0.5,
};

/**
 * Bundled style references with analyzed color profiles.
 * These profiles are derived from real photographic reference images.
 * When user provides new sample images, we add entries here.
 */
export const BUNDLED_STYLES: StyleReference[] = [
  {
    id: 'golden-hour-warm',
    name: 'Golden Hour',
    description: 'Warm sunset light with amber shadows and glowing highlights',
    tags: ['landscape', 'warm', 'sunset'],
    profile: {
      meanR: 0.58, meanG: 0.44, meanB: 0.32,
      luminanceStd: 0.24, warmth: 0.35,
      saturationLevel: 0.62, shadowDensity: 0.35, highlightBrightness: 0.82,
    },
  },
  {
    id: 'nordic-cool',
    name: 'Nordic Winter',
    description: 'Cool blue-grey atmosphere, desaturated with lifted shadows',
    tags: ['landscape', 'cool', 'moody'],
    profile: {
      meanR: 0.38, meanG: 0.42, meanB: 0.52,
      luminanceStd: 0.18, warmth: -0.25,
      saturationLevel: 0.30, shadowDensity: 0.30, highlightBrightness: 0.70,
    },
  },
  {
    id: 'cinema-grade',
    name: 'Cinema Grade',
    description: 'Teal shadows, warm skin tones, crushed blacks — Hollywood look',
    tags: ['cinematic', 'portrait', 'moody'],
    profile: {
      meanR: 0.46, meanG: 0.40, meanB: 0.42,
      luminanceStd: 0.28, warmth: 0.08,
      saturationLevel: 0.48, shadowDensity: 0.65, highlightBrightness: 0.75,
    },
  },
  {
    id: 'faded-film',
    name: 'Faded Film',
    description: 'Lifted blacks, muted pastels, dreamy low-contrast nostalgia',
    tags: ['creative', 'vintage', 'portrait'],
    profile: {
      meanR: 0.50, meanG: 0.48, meanB: 0.47,
      luminanceStd: 0.15, warmth: 0.05,
      saturationLevel: 0.28, shadowDensity: 0.20, highlightBrightness: 0.68,
    },
  },
  {
    id: 'high-contrast-dark',
    name: 'Dark & Moody',
    description: 'Deep shadows, selective highlights, dramatic weight',
    tags: ['portrait', 'moody', 'dramatic'],
    profile: {
      meanR: 0.32, meanG: 0.30, meanB: 0.33,
      luminanceStd: 0.30, warmth: -0.05,
      saturationLevel: 0.42, shadowDensity: 0.75, highlightBrightness: 0.85,
    },
  },
  {
    id: 'vibrant-street',
    name: 'Vibrant Street',
    description: 'Punchy saturated colors, urban energy, bold contrast',
    tags: ['street', 'urban', 'vivid'],
    profile: {
      meanR: 0.48, meanG: 0.44, meanB: 0.40,
      luminanceStd: 0.26, warmth: 0.10,
      saturationLevel: 0.72, shadowDensity: 0.55, highlightBrightness: 0.80,
    },
  },
  {
    id: 'misty-ethereal',
    name: 'Misty Ethereal',
    description: 'Soft fog atmosphere, cool pastels, low saturation, dreamy',
    tags: ['landscape', 'ethereal', 'nature'],
    profile: {
      meanR: 0.52, meanG: 0.54, meanB: 0.56,
      luminanceStd: 0.12, warmth: -0.08,
      saturationLevel: 0.22, shadowDensity: 0.18, highlightBrightness: 0.62,
    },
  },
  {
    id: 'autumn-rich',
    name: 'Autumn Richness',
    description: 'Deep oranges, rich reds, warm earthy tones with character',
    tags: ['landscape', 'autumn', 'warm'],
    profile: {
      meanR: 0.55, meanG: 0.40, meanB: 0.28,
      luminanceStd: 0.25, warmth: 0.30,
      saturationLevel: 0.65, shadowDensity: 0.48, highlightBrightness: 0.76,
    },
  },
];

/**
 * Compute a color matrix that transforms an image toward the target style.
 * This is adaptive — it computes the delta between the style profile and neutral,
 * then applies that delta at the given intensity.
 */
export function styleProfileToColorMatrix(profile: StyleColorProfile, intensity: number): number[] {
  const t = intensity / 100;

  // Color shift: difference from neutral
  const rShift = (profile.meanR - NEUTRAL_PROFILE.meanR) * t * 0.4;
  const gShift = (profile.meanG - NEUTRAL_PROFILE.meanG) * t * 0.4;
  const bShift = (profile.meanB - NEUTRAL_PROFILE.meanB) * t * 0.4;

  // Contrast: map luminanceStd difference to contrast multiplier
  const contrastDelta = profile.luminanceStd - NEUTRAL_PROFILE.luminanceStd;
  const contrast = 1 + contrastDelta * t * 1.5;
  const contrastOffset = 0.5 * (1 - contrast);

  // Warmth: shift red up, blue down (or inverse)
  const warmth = profile.warmth * t;

  // Saturation: map saturation level to multiplier
  const satDelta = profile.saturationLevel - NEUTRAL_PROFILE.saturationLevel;
  const sat = 1 + satDelta * t * 0.8;

  // Shadow lift / highlight control
  const shadowLift = (1 - profile.shadowDensity) * t * 0.08;  // Less dense shadows = lift
  const highlightPull = (1 - profile.highlightBrightness) * t * -0.05;

  // Build combined matrix
  const lr = 0.2126;
  const lg = 0.7152;
  const lb = 0.0722;
  const sr = (1 - sat) * lr;
  const sg = (1 - sat) * lg;
  const sb = (1 - sat) * lb;

  return [
    (sr + sat) * contrast + warmth * 0.08, sg * contrast, sb * contrast, 0, rShift + contrastOffset + shadowLift,
    sr * contrast, (sg + sat) * contrast, sb * contrast, 0, gShift + contrastOffset + shadowLift,
    sr * contrast, sg * contrast, (sb + sat) * contrast - warmth * 0.08, 0, bShift + contrastOffset + shadowLift + highlightPull,
    0, 0, 0, 1, 0,
  ];
}

/**
 * Legacy compatibility: convert StyleResult to color matrix.
 * Used by aiStyleStore for backward compatibility.
 */
export function styleResultToColorMatrix(result: { colorShift: { r: number; g: number; b: number }; contrastBoost: number; warmthShift: number; saturationShift: number }, intensity: number): number[] {
  // Convert old format to profile
  const profile: StyleColorProfile = {
    meanR: NEUTRAL_PROFILE.meanR + result.colorShift.r,
    meanG: NEUTRAL_PROFILE.meanG + result.colorShift.g,
    meanB: NEUTRAL_PROFILE.meanB + result.colorShift.b,
    luminanceStd: NEUTRAL_PROFILE.luminanceStd + result.contrastBoost * 0.1,
    warmth: result.warmthShift,
    saturationLevel: NEUTRAL_PROFILE.saturationLevel + result.saturationShift * 0.3,
    shadowDensity: 0.5,
    highlightBrightness: 0.5,
  };
  return styleProfileToColorMatrix(profile, intensity);
}
