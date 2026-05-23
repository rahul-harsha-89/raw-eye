/**
 * Rich preset data type for pro-grade film emulation.
 * Each preset defines tone curves, split toning, HSL adjustments, and grain.
 * All values are normalized 0-1 unless noted.
 */

/** Control points for a tone curve (cubic bezier approximation) */
export interface ToneCurve {
  /** Black point lift — how much to raise deepest shadows (0 = true black, 0.1 = lifted) */
  blackPoint: number;
  /** White point clip — how much to lower brightest highlights (1 = full white, 0.9 = rolled) */
  whitePoint: number;
  /** Shadow contrast — steepness of curve in shadows (0.5 = linear, >0.5 = more contrast) */
  shadowContrast: number;
  /** Highlight rolloff — how gently highlights compress (0.5 = linear, >0.5 = softer shoulder) */
  highlightRolloff: number;
  /** Midtone pivot — where the S-curve inflects (0.5 = center, lower = more shadow detail) */
  midtonePivot: number;
}

/** Split toning — luminance-dependent color casts */
export interface SplitTone {
  /** Shadow tint color [H, S] where H=0-360, S=0-1 */
  shadowHue: number;
  shadowSaturation: number;
  /** Highlight tint color [H, S] */
  highlightHue: number;
  highlightSaturation: number;
  /** Balance: -1 = shadows dominate, 0 = even, 1 = highlights dominate */
  balance: number;
}

/** HSL adjustment for a specific hue range */
export interface HSLAdjustment {
  /** Center hue in degrees 0-360 (0=red, 60=yellow, 120=green, 180=cyan, 240=blue, 300=magenta) */
  hueCenter: number;
  /** Range in degrees (how wide the adjustment affects) */
  hueRange: number;
  /** Hue shift in degrees (-30 to +30) */
  hueShift: number;
  /** Saturation multiplier (0.5 = halved, 1.0 = unchanged, 1.5 = boosted) */
  saturationMult: number;
  /** Luminance shift (-0.2 to +0.2) */
  luminanceShift: number;
}

/** Film grain characteristics */
export interface GrainConfig {
  /** Grain intensity 0-1 (0 = none, 0.15 = subtle, 0.4 = heavy) */
  intensity: number;
  /** Grain size in pixels (1.0 = fine, 2.5 = coarse) */
  size: number;
  /** How much grain responds to luminance (0 = uniform, 1 = midtone-heavy like real film) */
  luminanceResponse: number;
}

/** Complete film preset definition */
export interface FilmPreset {
  id: string;
  name: string;
  category: PresetCategory;
  description: string;
  /** Who this preset targets */
  useCase: string;

  /** Base color matrix (5x4) — exposure, WB, basic sat correction */
  colorMatrix: number[];

  /** Per-channel tone curves */
  toneCurves: {
    master: ToneCurve;
    red: ToneCurve;
    green: ToneCurve;
    blue: ToneCurve;
  };

  /** Split toning config */
  splitTone: SplitTone;

  /** HSL selective adjustments (up to 6 hue ranges) */
  hslAdjustments: HSLAdjustment[];

  /** Film grain config */
  grain: GrainConfig;

  /** Overall saturation multiplier (applied after curves) */
  saturationBoost: number;

  /** Vibrance (selective saturation — less saturated colors get more boost) */
  vibranceBoost: number;
}

export type PresetCategory =
  | 'Film Emulation'
  | 'Landscape'
  | 'Portrait'
  | 'Moody & Cinematic'
  | 'Black & White'
  | 'Minimalist'
  | 'Creative';

/** Identity preset (no change) */
export const IDENTITY_TONE_CURVE: ToneCurve = {
  blackPoint: 0,
  whitePoint: 1,
  shadowContrast: 0.5,
  highlightRolloff: 0.5,
  midtonePivot: 0.5,
};

export const IDENTITY_SPLIT_TONE: SplitTone = {
  shadowHue: 0,
  shadowSaturation: 0,
  highlightHue: 0,
  highlightSaturation: 0,
  balance: 0,
};

export const NO_GRAIN: GrainConfig = {
  intensity: 0,
  size: 1,
  luminanceResponse: 0,
};

/** Identity color matrix */
export const IDENTITY_MATRIX: number[] = [
  1, 0, 0, 0, 0,
  0, 1, 0, 0, 0,
  0, 0, 1, 0, 0,
  0, 0, 0, 1, 0,
];
