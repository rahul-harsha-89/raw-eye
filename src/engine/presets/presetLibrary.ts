import type { FilmPreset, PresetCategory } from './FilmPreset';
import {
  IDENTITY_TONE_CURVE,
  IDENTITY_SPLIT_TONE,
  IDENTITY_MATRIX,
  NO_GRAIN,
} from './FilmPreset';

/**
 * Pro-grade preset library — 15 presets across 6 categories.
 * Values derived from real film stock densitometry data, color science research,
 * and professional preset analysis (Dehancer, VSCO, Mastin Labs references).
 */

// =============================================================================
// FILM EMULATION (4 presets)
// =============================================================================

const PORTRA_400: FilmPreset = {
  id: 'portra-400',
  name: 'Portra',
  category: 'Film Emulation',
  description: 'Kodak\'s iconic portrait film. Warm shadows, gentle highlight rolloff, flattering skin tones.',
  useCase: 'Portraits, weddings, golden hour, street',
  colorMatrix: [
    1.04, 0.03, -0.01, 0, 0.01,
    0.01, 1.02, 0.01, 0, 0.008,
    -0.02, 0.01, 0.94, 0, 0.025,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.07,       // Film lifts blacks to ~18/255
      whitePoint: 0.97,       // Gentle highlight compression
      shadowContrast: 0.42,   // Softer shadow contrast
      highlightRolloff: 0.72, // Very gentle shoulder — Portra's signature
      midtonePivot: 0.48,
    },
    red: {
      blackPoint: 0.075,      // Warm shadow bias
      whitePoint: 0.97,
      shadowContrast: 0.44,
      highlightRolloff: 0.70,
      midtonePivot: 0.49,
    },
    green: {
      blackPoint: 0.065,
      whitePoint: 0.97,
      shadowContrast: 0.43,
      highlightRolloff: 0.71,
      midtonePivot: 0.48,
    },
    blue: {
      blackPoint: 0.055,      // Less blue in shadows = warm shadow cast
      whitePoint: 0.96,
      shadowContrast: 0.45,
      highlightRolloff: 0.68,
      midtonePivot: 0.47,
    },
  },
  splitTone: {
    shadowHue: 30,            // Warm amber shadows
    shadowSaturation: 0.12,
    highlightHue: 45,         // Slightly warm highlights
    highlightSaturation: 0.05,
    balance: -0.15,           // Shadows slightly stronger
  },
  hslAdjustments: [
    { hueCenter: 15, hueRange: 40, hueShift: 3, saturationMult: 1.08, luminanceShift: 0.02 },   // Reds/oranges: boost for skin
    { hueCenter: 210, hueRange: 50, hueShift: 0, saturationMult: 0.82, luminanceShift: -0.02 },  // Blues: muted (Portra signature)
    { hueCenter: 120, hueRange: 40, hueShift: -8, saturationMult: 0.90, luminanceShift: 0 },     // Greens: shift toward yellow-green
  ],
  grain: {
    intensity: 0.06,          // RMS 8 — very fine for 400 speed
    size: 1.0,
    luminanceResponse: 0.7,   // More grain in midtones
  },
  saturationBoost: 0.98,      // Slightly desaturated overall
  vibranceBoost: 1.04,        // But vibrance lifts muted colors
};

const VELVIA_50: FilmPreset = {
  id: 'velvia-50',
  name: 'Velvia',
  category: 'Film Emulation',
  description: 'Fuji\'s legendary landscape film. Extreme saturation, deep blacks, punchy greens and reds.',
  useCase: 'Landscapes, nature, autumn foliage, sunsets',
  colorMatrix: [
    1.12, 0, -0.02, 0, 0,
    0, 1.08, 0, 0, 0,
    0, 0, 1.10, 0, 0,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.015,      // Near-zero — slide film has deep Dmax
      whitePoint: 0.94,       // Abrupt highlight clip — narrow latitude
      shadowContrast: 0.62,   // Steep contrast
      highlightRolloff: 0.38, // Hard shoulder — highlights clip fast
      midtonePivot: 0.52,
    },
    red: {
      blackPoint: 0.012,
      whitePoint: 0.93,
      shadowContrast: 0.64,
      highlightRolloff: 0.36,
      midtonePivot: 0.53,
    },
    green: {
      blackPoint: 0.015,
      whitePoint: 0.95,
      shadowContrast: 0.60,
      highlightRolloff: 0.40,
      midtonePivot: 0.51,
    },
    blue: {
      blackPoint: 0.02,       // Slight blue-green bias in shadows
      whitePoint: 0.93,
      shadowContrast: 0.63,
      highlightRolloff: 0.35,
      midtonePivot: 0.52,
    },
  },
  splitTone: {
    shadowHue: 260,           // Purplish cast in deep shadows
    shadowSaturation: 0.06,
    highlightHue: 45,         // Warm golden highlights
    highlightSaturation: 0.04,
    balance: 0.1,
  },
  hslAdjustments: [
    { hueCenter: 0, hueRange: 30, hueShift: 2, saturationMult: 1.30, luminanceShift: 0.03 },    // Reds: dramatically boosted (~30%)
    { hueCenter: 60, hueRange: 35, hueShift: 0, saturationMult: 1.25, luminanceShift: 0.02 },    // Yellows: vivid
    { hueCenter: 120, hueRange: 45, hueShift: 0, saturationMult: 1.28, luminanceShift: 0.03 },   // Greens: vivid — landscape key
    { hueCenter: 200, hueRange: 50, hueShift: -5, saturationMult: 1.20, luminanceShift: 0 },     // Blues/sky: punchy
  ],
  grain: {
    intensity: 0.03,          // Extremely fine — ISO 50
    size: 0.8,
    luminanceResponse: 0.5,
  },
  saturationBoost: 1.0,       // colorMatrix [1.12/1.08/1.10] + HSL handle saturation — no extra boost needed
  vibranceBoost: 1.05,
};

const CINESTILL_800T: FilmPreset = {
  id: 'cinestill-800t',
  name: 'Cinestill',
  category: 'Film Emulation',
  description: 'Tungsten cinema stock. Blue shadows, neon reds, cinematic night tones.',
  useCase: 'Night photography, urban, neon signs, street at night',
  colorMatrix: [
    1.0, 0, 0.02, 0, 0,
    0, 0.95, 0.03, 0, 0,
    0.04, 0.06, 1.15, 0, 0.02,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.09,       // Lifted shadows — cinematic feel
      whitePoint: 0.96,
      shadowContrast: 0.48,
      highlightRolloff: 0.58,
      midtonePivot: 0.47,
    },
    red: {
      blackPoint: 0.06,
      whitePoint: 0.97,
      shadowContrast: 0.50,
      highlightRolloff: 0.55,
      midtonePivot: 0.48,
    },
    green: {
      blackPoint: 0.08,
      whitePoint: 0.95,
      shadowContrast: 0.47,
      highlightRolloff: 0.58,
      midtonePivot: 0.46,
    },
    blue: {
      blackPoint: 0.12,       // Strong blue lift in shadows — tungsten signature
      whitePoint: 0.95,
      shadowContrast: 0.44,
      highlightRolloff: 0.60,
      midtonePivot: 0.45,
    },
  },
  splitTone: {
    shadowHue: 220,           // Cool blue shadows
    shadowSaturation: 0.18,
    highlightHue: 25,         // Warm orange highlights (tungsten light)
    highlightSaturation: 0.10,
    balance: -0.2,            // Shadow tint dominates
  },
  hslAdjustments: [
    { hueCenter: 0, hueRange: 25, hueShift: 5, saturationMult: 1.35, luminanceShift: 0.04 },    // Reds: neon pop (signature)
    { hueCenter: 30, hueRange: 30, hueShift: -5, saturationMult: 1.15, luminanceShift: 0.02 },   // Oranges: warm shift
    { hueCenter: 170, hueRange: 40, hueShift: 10, saturationMult: 1.10, luminanceShift: -0.02 }, // Cyans: shift toward teal
    { hueCenter: 240, hueRange: 40, hueShift: 0, saturationMult: 1.12, luminanceShift: 0 },      // Blues: enhanced
  ],
  grain: {
    intensity: 0.15,          // Visible grain — ISO 800
    size: 1.8,
    luminanceResponse: 0.6,
  },
  saturationBoost: 1.05,
  vibranceBoost: 1.08,
};

const EKTAR_100: FilmPreset = {
  id: 'ektar-100',
  name: 'Ektar',
  category: 'Film Emulation',
  description: 'Kodak\'s vivid color negative. Punchy, saturated, fine grain. Great for bold landscapes.',
  useCase: 'Landscapes, travel, architecture, vivid scenes',
  colorMatrix: [
    1.08, 0.02, 0, 0, 0,
    0, 1.05, 0, 0, 0,
    0, 0, 1.06, 0, -0.01,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.035,
      whitePoint: 0.97,
      shadowContrast: 0.55,   // Moderate-high contrast
      highlightRolloff: 0.60,
      midtonePivot: 0.50,
    },
    red: {
      blackPoint: 0.04,
      whitePoint: 0.97,
      shadowContrast: 0.56,
      highlightRolloff: 0.58,
      midtonePivot: 0.51,
    },
    green: {
      blackPoint: 0.03,
      whitePoint: 0.97,
      shadowContrast: 0.54,
      highlightRolloff: 0.60,
      midtonePivot: 0.50,
    },
    blue: {
      blackPoint: 0.03,
      whitePoint: 0.96,
      shadowContrast: 0.55,
      highlightRolloff: 0.57,
      midtonePivot: 0.49,
    },
  },
  splitTone: {
    shadowHue: 40,            // Slight yellow-green cast
    shadowSaturation: 0.04,
    highlightHue: 50,
    highlightSaturation: 0.03,
    balance: 0,
  },
  hslAdjustments: [
    { hueCenter: 0, hueRange: 35, hueShift: 0, saturationMult: 1.22, luminanceShift: 0.02 },    // Reds: strong boost
    { hueCenter: 60, hueRange: 30, hueShift: 3, saturationMult: 1.18, luminanceShift: 0.01 },    // Yellows: vivid
    { hueCenter: 120, hueRange: 40, hueShift: 0, saturationMult: 1.15, luminanceShift: 0.02 },   // Greens: vivid
    { hueCenter: 210, hueRange: 45, hueShift: 0, saturationMult: 1.12, luminanceShift: 0 },      // Blues: boosted
  ],
  grain: {
    intensity: 0.025,         // Finest grain C-41 film
    size: 0.7,
    luminanceResponse: 0.4,
  },
  saturationBoost: 1.0,       // colorMatrix [1.08/1.05/1.06] + HSL adjustments handle the vivid look
  vibranceBoost: 1.04,
};

// =============================================================================
// LANDSCAPE (3 presets)
// =============================================================================

const GOLDEN_HOUR: FilmPreset = {
  id: 'golden-hour',
  name: 'Golden',
  category: 'Landscape',
  description: 'Enhances warm light, deepens skies, brings out sunset/sunrise magic.',
  useCase: 'Sunsets, sunrise, golden hour landscapes, warm light scenes',
  colorMatrix: [
    1.10, 0.04, 0, 0, 0.02,
    0.02, 1.04, 0, 0, 0.01,
    0, 0, 0.88, 0, 0,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.03,
      whitePoint: 0.98,
      shadowContrast: 0.52,
      highlightRolloff: 0.65,  // Gentle highlights for golden glow
      midtonePivot: 0.50,
    },
    red: {
      blackPoint: 0.04,
      whitePoint: 0.99,
      shadowContrast: 0.50,
      highlightRolloff: 0.68,
      midtonePivot: 0.52,
    },
    green: {
      blackPoint: 0.03,
      whitePoint: 0.97,
      shadowContrast: 0.52,
      highlightRolloff: 0.64,
      midtonePivot: 0.50,
    },
    blue: {
      blackPoint: 0.02,
      whitePoint: 0.92,        // Blue channel compressed — warm bias
      shadowContrast: 0.54,
      highlightRolloff: 0.55,
      midtonePivot: 0.48,
    },
  },
  splitTone: {
    shadowHue: 25,             // Warm amber shadows
    shadowSaturation: 0.10,
    highlightHue: 40,          // Golden highlights
    highlightSaturation: 0.14,
    balance: 0.2,              // Highlights carry the warmth
  },
  hslAdjustments: [
    { hueCenter: 30, hueRange: 40, hueShift: -5, saturationMult: 1.20, luminanceShift: 0.03 },  // Oranges: glow
    { hueCenter: 60, hueRange: 30, hueShift: -8, saturationMult: 1.15, luminanceShift: 0.02 },  // Yellows: push toward gold
    { hueCenter: 210, hueRange: 50, hueShift: 5, saturationMult: 1.12, luminanceShift: -0.03 }, // Blues: deepen sky
    { hueCenter: 0, hueRange: 25, hueShift: 5, saturationMult: 1.10, luminanceShift: 0.02 },    // Reds: warm boost
  ],
  grain: NO_GRAIN,
  saturationBoost: 1.08,
  vibranceBoost: 1.12,
};

const MISTY_DAWN: FilmPreset = {
  id: 'misty-dawn',
  name: 'Misty',
  category: 'Landscape',
  description: 'Ethereal atmosphere. Lifted shadows, soft contrast, dreamy pastel tones for foggy mornings.',
  useCase: 'Fog, mist, forest, mountain morning, lakes',
  colorMatrix: [
    0.98, 0.02, 0.02, 0, 0.02,
    0.01, 0.98, 0.02, 0, 0.02,
    0.01, 0.03, 0.98, 0, 0.03,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.10,       // Heavily lifted blacks — fog feel
      whitePoint: 0.95,
      shadowContrast: 0.35,   // Very soft shadow contrast
      highlightRolloff: 0.70, // Gentle highlights
      midtonePivot: 0.52,
    },
    red: {
      blackPoint: 0.10,
      whitePoint: 0.95,
      shadowContrast: 0.36,
      highlightRolloff: 0.68,
      midtonePivot: 0.52,
    },
    green: {
      blackPoint: 0.10,
      whitePoint: 0.96,
      shadowContrast: 0.35,
      highlightRolloff: 0.70,
      midtonePivot: 0.52,
    },
    blue: {
      blackPoint: 0.11,       // Slight cool bias in lifted shadows
      whitePoint: 0.95,
      shadowContrast: 0.34,
      highlightRolloff: 0.72,
      midtonePivot: 0.53,
    },
  },
  splitTone: {
    shadowHue: 210,           // Cool blue mist
    shadowSaturation: 0.08,
    highlightHue: 40,         // Faint warm glow
    highlightSaturation: 0.06,
    balance: -0.1,
  },
  hslAdjustments: [
    { hueCenter: 120, hueRange: 50, hueShift: 10, saturationMult: 0.75, luminanceShift: 0.04 },  // Greens: desaturated, shifted teal
    { hueCenter: 210, hueRange: 40, hueShift: 0, saturationMult: 0.80, luminanceShift: 0.02 },   // Blues: muted, lighter
    { hueCenter: 30, hueRange: 30, hueShift: 0, saturationMult: 0.85, luminanceShift: 0.02 },    // Oranges: soften
  ],
  grain: {
    intensity: 0.04,
    size: 1.2,
    luminanceResponse: 0.3,
  },
  saturationBoost: 0.82,      // Distinctly desaturated — ethereal
  vibranceBoost: 0.95,
};

const DRAMATIC_STORM: FilmPreset = {
  id: 'dramatic-storm',
  name: 'Storm',
  category: 'Landscape',
  description: 'High contrast, deep shadows, moody skies. For dramatic weather and rugged terrain.',
  useCase: 'Storm clouds, mountains, dramatic skies, rugged coast, dark landscapes',
  colorMatrix: [
    1.02, 0, 0, 0, -0.02,
    0, 1.0, 0, 0, -0.02,
    0, 0.02, 1.04, 0, -0.01,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.02,       // Deep blacks — dramatic
      whitePoint: 0.98,
      shadowContrast: 0.65,   // Strong shadow contrast
      highlightRolloff: 0.50,
      midtonePivot: 0.45,     // Darker midtones — weight toward shadows
    },
    red: {
      blackPoint: 0.02,
      whitePoint: 0.97,
      shadowContrast: 0.63,
      highlightRolloff: 0.48,
      midtonePivot: 0.44,
    },
    green: {
      blackPoint: 0.02,
      whitePoint: 0.97,
      shadowContrast: 0.64,
      highlightRolloff: 0.50,
      midtonePivot: 0.45,
    },
    blue: {
      blackPoint: 0.025,
      whitePoint: 0.98,
      shadowContrast: 0.66,
      highlightRolloff: 0.52,
      midtonePivot: 0.46,
    },
  },
  splitTone: {
    shadowHue: 220,           // Cool blue-grey shadows
    shadowSaturation: 0.10,
    highlightHue: 200,        // Cool steel highlights
    highlightSaturation: 0.04,
    balance: -0.15,
  },
  hslAdjustments: [
    { hueCenter: 210, hueRange: 50, hueShift: 0, saturationMult: 1.15, luminanceShift: -0.04 },  // Blues/sky: deeper, richer
    { hueCenter: 180, hueRange: 35, hueShift: -10, saturationMult: 1.10, luminanceShift: -0.02 }, // Cyans: push toward blue
    { hueCenter: 120, hueRange: 40, hueShift: 5, saturationMult: 0.90, luminanceShift: -0.03 },   // Greens: muted, darker
    { hueCenter: 30, hueRange: 30, hueShift: 0, saturationMult: 0.85, luminanceShift: -0.01 },    // Oranges: desaturated
  ],
  grain: {
    intensity: 0.05,
    size: 1.3,
    luminanceResponse: 0.5,
  },
  saturationBoost: 0.95,
  vibranceBoost: 1.08,
};

// =============================================================================
// PORTRAIT (2 presets)
// =============================================================================

const SOFT_SKIN: FilmPreset = {
  id: 'soft-skin',
  name: 'Soft Skin',
  category: 'Portrait',
  description: 'Creamy skin tones, lifted shadows, gentle warmth. Designed for portraiture across all skin tones.',
  useCase: 'Portraits, headshots, couples, family',
  colorMatrix: [
    1.03, 0.02, 0, 0, 0.015,
    0.01, 1.01, 0.01, 0, 0.01,
    0, 0.01, 0.96, 0, 0.02,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.06,
      whitePoint: 0.98,
      shadowContrast: 0.40,   // Soft — no harsh shadows on face
      highlightRolloff: 0.70, // Smooth highlight transition
      midtonePivot: 0.52,     // Slightly bright midtones
    },
    red: {
      blackPoint: 0.065,
      whitePoint: 0.98,
      shadowContrast: 0.42,
      highlightRolloff: 0.68,
      midtonePivot: 0.53,
    },
    green: {
      blackPoint: 0.055,
      whitePoint: 0.98,
      shadowContrast: 0.40,
      highlightRolloff: 0.70,
      midtonePivot: 0.52,
    },
    blue: {
      blackPoint: 0.05,
      whitePoint: 0.97,
      shadowContrast: 0.41,
      highlightRolloff: 0.67,
      midtonePivot: 0.51,
    },
  },
  splitTone: {
    shadowHue: 20,            // Warm shadow fill
    shadowSaturation: 0.08,
    highlightHue: 35,         // Gentle warmth
    highlightSaturation: 0.05,
    balance: 0,
  },
  hslAdjustments: [
    { hueCenter: 15, hueRange: 35, hueShift: 2, saturationMult: 1.05, luminanceShift: 0.03 },   // Skin reds: subtle boost + brighten
    { hueCenter: 35, hueRange: 25, hueShift: -2, saturationMult: 1.02, luminanceShift: 0.02 },   // Skin oranges: warm shift
    { hueCenter: 55, hueRange: 20, hueShift: -3, saturationMult: 0.95, luminanceShift: 0.01 },   // Yellows: prevent sickly tones
    { hueCenter: 120, hueRange: 40, hueShift: 0, saturationMult: 0.88, luminanceShift: 0 },      // Greens: mute background
  ],
  grain: {
    intensity: 0.03,
    size: 0.9,
    luminanceResponse: 0.6,
  },
  saturationBoost: 0.96,      // Slightly desat for clean skin
  vibranceBoost: 1.02,
};

const EDITORIAL: FilmPreset = {
  id: 'editorial',
  name: 'Editorial',
  category: 'Portrait',
  description: 'High-fashion editorial look. Refined contrast, slightly cool, punchy but controlled.',
  useCase: 'Fashion, editorial, lookbooks, model portfolios',
  colorMatrix: [
    1.02, 0, 0, 0, -0.01,
    0, 1.0, 0, 0, -0.01,
    0, 0.02, 1.03, 0, 0,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.04,
      whitePoint: 0.97,
      shadowContrast: 0.58,   // Punchy shadows
      highlightRolloff: 0.55,
      midtonePivot: 0.48,
    },
    red: {
      blackPoint: 0.04,
      whitePoint: 0.97,
      shadowContrast: 0.57,
      highlightRolloff: 0.54,
      midtonePivot: 0.48,
    },
    green: {
      blackPoint: 0.04,
      whitePoint: 0.97,
      shadowContrast: 0.58,
      highlightRolloff: 0.55,
      midtonePivot: 0.48,
    },
    blue: {
      blackPoint: 0.045,
      whitePoint: 0.97,
      shadowContrast: 0.59,
      highlightRolloff: 0.56,
      midtonePivot: 0.49,
    },
  },
  splitTone: {
    shadowHue: 230,           // Cool blue-grey shadows
    shadowSaturation: 0.06,
    highlightHue: 40,         // Faint warmth in highlights
    highlightSaturation: 0.03,
    balance: 0.05,
  },
  hslAdjustments: [
    { hueCenter: 15, hueRange: 30, hueShift: 0, saturationMult: 1.0, luminanceShift: 0.02 },    // Skin: maintain, brighten slightly
    { hueCenter: 210, hueRange: 40, hueShift: 5, saturationMult: 1.08, luminanceShift: -0.02 },  // Blues: slightly enhanced
    { hueCenter: 60, hueRange: 30, hueShift: 0, saturationMult: 0.85, luminanceShift: 0 },       // Yellows: muted
  ],
  grain: NO_GRAIN,
  saturationBoost: 0.94,
  vibranceBoost: 1.06,
};

// =============================================================================
// MOODY & CINEMATIC (2 presets)
// =============================================================================

const TEAL_ORANGE: FilmPreset = {
  id: 'teal-orange',
  name: 'Teal',
  category: 'Moody & Cinematic',
  description: 'The iconic Hollywood color grade. Complementary teal shadows + warm highlights.',
  useCase: 'Cinematic, travel, urban, portraits with character',
  colorMatrix: [
    1.06, 0.02, -0.02, 0, 0,
    0, 0.98, 0.02, 0, 0,
    -0.03, 0.04, 1.08, 0, 0,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.05,
      whitePoint: 0.97,
      shadowContrast: 0.55,
      highlightRolloff: 0.58,
      midtonePivot: 0.47,
    },
    red: {
      blackPoint: 0.03,       // Less red in shadows = cool shadows
      whitePoint: 0.98,
      shadowContrast: 0.56,
      highlightRolloff: 0.60,
      midtonePivot: 0.49,
    },
    green: {
      blackPoint: 0.05,
      whitePoint: 0.96,
      shadowContrast: 0.54,
      highlightRolloff: 0.57,
      midtonePivot: 0.47,
    },
    blue: {
      blackPoint: 0.08,       // Blue pushed in shadows = teal
      whitePoint: 0.93,       // Blue pulled in highlights = warm
      shadowContrast: 0.52,
      highlightRolloff: 0.55,
      midtonePivot: 0.46,
    },
  },
  splitTone: {
    shadowHue: 190,           // Teal
    shadowSaturation: 0.20,
    highlightHue: 30,         // Orange
    highlightSaturation: 0.16,
    balance: 0,
  },
  hslAdjustments: [
    { hueCenter: 180, hueRange: 50, hueShift: -10, saturationMult: 1.20, luminanceShift: -0.03 }, // Push shadows toward teal
    { hueCenter: 30, hueRange: 35, hueShift: 0, saturationMult: 1.15, luminanceShift: 0.02 },     // Oranges: boost
    { hueCenter: 15, hueRange: 25, hueShift: 5, saturationMult: 1.08, luminanceShift: 0.02 },     // Reds: warm push
    { hueCenter: 120, hueRange: 40, hueShift: 20, saturationMult: 0.80, luminanceShift: -0.02 },  // Greens: shift toward teal, desaturate
  ],
  grain: {
    intensity: 0.05,
    size: 1.3,
    luminanceResponse: 0.5,
  },
  saturationBoost: 1.02,
  vibranceBoost: 1.08,
};

const FADED_NOIR: FilmPreset = {
  id: 'faded-noir',
  name: 'Noir',
  category: 'Moody & Cinematic',
  description: 'Heavily lifted blacks, desaturated, moody atmosphere. Film noir meets modern.',
  useCase: 'Moody portraits, urban decay, rainy days, introspective work',
  colorMatrix: [
    0.95, 0.03, 0.02, 0, 0.03,
    0.02, 0.94, 0.03, 0, 0.03,
    0.02, 0.04, 0.92, 0, 0.04,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.14,       // Heavily lifted — signature faded look
      whitePoint: 0.92,       // Pulled highlights
      shadowContrast: 0.38,   // Flat shadows
      highlightRolloff: 0.65,
      midtonePivot: 0.50,
    },
    red: {
      blackPoint: 0.14,
      whitePoint: 0.92,
      shadowContrast: 0.39,
      highlightRolloff: 0.63,
      midtonePivot: 0.50,
    },
    green: {
      blackPoint: 0.13,
      whitePoint: 0.92,
      shadowContrast: 0.38,
      highlightRolloff: 0.65,
      midtonePivot: 0.50,
    },
    blue: {
      blackPoint: 0.15,       // Extra blue lift in shadows
      whitePoint: 0.91,
      shadowContrast: 0.37,
      highlightRolloff: 0.66,
      midtonePivot: 0.51,
    },
  },
  splitTone: {
    shadowHue: 230,           // Cool blue-purple shadows
    shadowSaturation: 0.10,
    highlightHue: 45,         // Faint warm highlights
    highlightSaturation: 0.05,
    balance: -0.1,
  },
  hslAdjustments: [
    { hueCenter: 0, hueRange: 180, hueShift: 0, saturationMult: 0.75, luminanceShift: 0 },       // Global desat
    { hueCenter: 210, hueRange: 40, hueShift: 10, saturationMult: 0.90, luminanceShift: 0 },      // Blues: keep some color
  ],
  grain: {
    intensity: 0.10,
    size: 1.5,
    luminanceResponse: 0.4,
  },
  saturationBoost: 0.70,      // Heavy desaturation
  vibranceBoost: 0.85,
};

// =============================================================================
// BLACK & WHITE (2 presets)
// =============================================================================

const TRI_X_400: FilmPreset = {
  id: 'tri-x-400',
  name: 'Tri-X',
  category: 'Black & White',
  description: 'Kodak\'s classic B&W film. High midtone contrast, gritty grain, punchy tonal range.',
  useCase: 'Street, documentary, photojournalism, gritty portraits',
  colorMatrix: [
    // Luminance-weighted B&W conversion with red bias (mimics red filter on B&W film)
    0.35, 0.55, 0.10, 0, -0.02,
    0.35, 0.55, 0.10, 0, -0.02,
    0.35, 0.55, 0.10, 0, -0.02,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.02,       // Deep blacks
      whitePoint: 0.98,
      shadowContrast: 0.60,   // Punchy
      highlightRolloff: 0.50, // Moderate shoulder
      midtonePivot: 0.48,
    },
    // For B&W, per-channel curves affect which tones go light/dark
    red: {
      blackPoint: 0.02,
      whitePoint: 0.98,
      shadowContrast: 0.62,   // Red filter effect — skies darken
      highlightRolloff: 0.48,
      midtonePivot: 0.49,
    },
    green: {
      blackPoint: 0.02,
      whitePoint: 0.98,
      shadowContrast: 0.58,
      highlightRolloff: 0.50,
      midtonePivot: 0.48,
    },
    blue: {
      blackPoint: 0.025,
      whitePoint: 0.97,
      shadowContrast: 0.55,
      highlightRolloff: 0.52,
      midtonePivot: 0.47,
    },
  },
  splitTone: IDENTITY_SPLIT_TONE,  // Pure B&W — no toning
  hslAdjustments: [],              // N/A for B&W
  grain: {
    intensity: 0.18,               // RMS 17 — classic Tri-X grit
    size: 1.8,
    luminanceResponse: 0.7,
  },
  saturationBoost: 0,              // Full desaturation
  vibranceBoost: 0,
};

const SILVER_GELATIN: FilmPreset = {
  id: 'silver-gelatin',
  name: 'Gelatin',
  category: 'Black & White',
  description: 'Smooth fine-art B&W. Full tonal range, subtle grain, elegant shadow detail. Inspired by HP5.',
  useCase: 'Fine art, architecture, nature, long exposure, studio',
  colorMatrix: [
    // Green-weighted conversion (mimics green filter — flattering for skin/foliage)
    0.25, 0.62, 0.13, 0, 0,
    0.25, 0.62, 0.13, 0, 0,
    0.25, 0.62, 0.13, 0, 0,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.03,
      whitePoint: 0.99,
      shadowContrast: 0.48,   // Moderate — more shadow detail than Tri-X
      highlightRolloff: 0.62, // Gentle — full tonal range
      midtonePivot: 0.50,
    },
    red: {
      blackPoint: 0.03,
      whitePoint: 0.99,
      shadowContrast: 0.47,
      highlightRolloff: 0.60,
      midtonePivot: 0.50,
    },
    green: {
      blackPoint: 0.03,
      whitePoint: 0.99,
      shadowContrast: 0.48,
      highlightRolloff: 0.62,
      midtonePivot: 0.50,
    },
    blue: {
      blackPoint: 0.035,
      whitePoint: 0.98,
      shadowContrast: 0.46,
      highlightRolloff: 0.63,
      midtonePivot: 0.49,
    },
  },
  splitTone: {
    shadowHue: 35,             // Faint selenium tone
    shadowSaturation: 0.03,
    highlightHue: 40,
    highlightSaturation: 0.02,
    balance: 0,
  },
  hslAdjustments: [],
  grain: {
    intensity: 0.08,
    size: 1.2,
    luminanceResponse: 0.65,
  },
  saturationBoost: 0,
  vibranceBoost: 0,
};

// =============================================================================
// BLACK & WHITE — MASTER PHOTOGRAPHERS (6 more presets)
// Inspired by the most celebrated B&W photographers in history.
// Each conversion matrix and tonal curve is tuned to replicate their
// signature rendering style.
// =============================================================================

/** Ansel Adams — Zone System precision
 *  Full tonal range from Zone 0 (pure black) to Zone X (pure white).
 *  Every shadow retains texture; every highlight holds detail.
 *  Slight selenium warm tone on deep shadows. No grain — large-format plates.
 */
const ZONE_SYSTEM: FilmPreset = {
  id: 'zone-system',
  name: 'Zone',
  category: 'Black & White',
  description: 'Ansel Adams — Full tonal range, 10-zone precision. Deep blacks with shadow texture. Faint selenium shadow tone.',
  useCase: 'Landscapes, architecture, long exposure, fine-art prints, any scene with rich tonal range',
  colorMatrix: [
    // Luminosity weights with slight red bias: open skies go darker, skin brighter
    0.28, 0.62, 0.10, 0, 0,
    0.28, 0.62, 0.10, 0, 0,
    0.28, 0.62, 0.10, 0, 0,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.01,        // Near-zero — film base + fog only
      whitePoint: 0.995,       // Full white — Zone X
      shadowContrast: 0.50,    // Precise separation in shadows (Zone III–IV)
      highlightRolloff: 0.58,  // Gentle shoulder — highlights hold detail (Zone VIII)
      midtonePivot: 0.50,
    },
    red: { blackPoint: 0.01, whitePoint: 0.995, shadowContrast: 0.50, highlightRolloff: 0.56, midtonePivot: 0.50 },
    green: { blackPoint: 0.01, whitePoint: 0.995, shadowContrast: 0.50, highlightRolloff: 0.58, midtonePivot: 0.50 },
    blue: { blackPoint: 0.01, whitePoint: 0.995, shadowContrast: 0.50, highlightRolloff: 0.60, midtonePivot: 0.50 },
  },
  splitTone: {
    shadowHue: 25,             // Warm selenium shadows — Ansel's darkroom choice
    shadowSaturation: 0.05,
    highlightHue: 40,
    highlightSaturation: 0.015,
    balance: -0.2,
  },
  hslAdjustments: [],
  grain: NO_GRAIN,             // 4×5 and 8×10 view camera — no perceptible grain
  saturationBoost: 0,
  vibranceBoost: 0,
};

/** Henri Cartier-Bresson — The Decisive Moment
 *  Documentary B&W: natural tonal rendering, honest mid-contrast.
 *  Standard luminosity conversion — nothing added, nothing removed.
 *  Classic 35mm grain from Tri-X in a Leica.
 */
const DECISIVE_MOMENT: FilmPreset = {
  id: 'decisive-moment',
  name: 'Decisive',
  category: 'Black & White',
  description: 'Henri Cartier-Bresson — Honest documentary rendering. Natural luminosity, moderate contrast, classic 35mm grain.',
  useCase: 'Street, reportage, documentary, candid, everyday life',
  colorMatrix: [
    // Standard photographic luminosity weights
    0.21, 0.72, 0.07, 0, 0,
    0.21, 0.72, 0.07, 0, 0,
    0.21, 0.72, 0.07, 0, 0,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.04,        // Slightly lifted — newsprint rendering
      whitePoint: 0.97,
      shadowContrast: 0.52,    // Moderate — truthful shadows
      highlightRolloff: 0.60,
      midtonePivot: 0.49,
    },
    red: { blackPoint: 0.04, whitePoint: 0.97, shadowContrast: 0.52, highlightRolloff: 0.59, midtonePivot: 0.49 },
    green: { blackPoint: 0.04, whitePoint: 0.97, shadowContrast: 0.52, highlightRolloff: 0.60, midtonePivot: 0.49 },
    blue: { blackPoint: 0.045, whitePoint: 0.97, shadowContrast: 0.51, highlightRolloff: 0.61, midtonePivot: 0.49 },
  },
  splitTone: IDENTITY_SPLIT_TONE,  // Pure — no toning, truth above aesthetics
  hslAdjustments: [],
  grain: {
    intensity: 0.14,           // Tri-X 400 pushed in Leica — visible, honest grain
    size: 1.6,
    luminanceResponse: 0.65,
  },
  saturationBoost: 0,
  vibranceBoost: 0,
};

/** Sebastião Salgado — Biblical Drama
 *  Extreme contrast, deep impenetrable shadows, luminous highlights.
 *  Used in "Workers" and "Genesis" — otherworldly, monumental feel.
 *  Red-channel boost darkens skies and separates tones dramatically.
 */
const BIBLICAL_SHADOW: FilmPreset = {
  id: 'biblical-shadow',
  name: 'Biblical',
  category: 'Black & White',
  description: 'Sebastião Salgado — Extreme contrast, impenetrable shadows, luminous highlights. Epic, monumental.',
  useCase: 'Dramatic portraits, rugged landscapes, labour, epic scenes, strong directional light',
  colorMatrix: [
    // Heavy red-channel bias: sky/blue scenes go very dark, warm skin tones go bright
    0.45, 0.48, 0.07, 0, -0.02,
    0.45, 0.48, 0.07, 0, -0.02,
    0.45, 0.48, 0.07, 0, -0.02,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.01,        // Absolute blacks — shadow detail not a priority
      whitePoint: 0.97,
      shadowContrast: 0.72,    // Very steep — mid-tones crush into black
      highlightRolloff: 0.42,  // Hard shoulder — highlights clip sharply
      midtonePivot: 0.44,      // Dark weight: scale tips toward shadows
    },
    red: { blackPoint: 0.01, whitePoint: 0.97, shadowContrast: 0.74, highlightRolloff: 0.40, midtonePivot: 0.43 },
    green: { blackPoint: 0.01, whitePoint: 0.97, shadowContrast: 0.70, highlightRolloff: 0.43, midtonePivot: 0.44 },
    blue: { blackPoint: 0.015, whitePoint: 0.96, shadowContrast: 0.68, highlightRolloff: 0.45, midtonePivot: 0.45 },
  },
  splitTone: {
    shadowHue: 30,             // Faint warm muddy shadows
    shadowSaturation: 0.04,
    highlightHue: 50,
    highlightSaturation: 0.02,
    balance: -0.2,
  },
  hslAdjustments: [],
  grain: {
    intensity: 0.12,           // Visible grain adds texture to huge prints
    size: 1.7,
    luminanceResponse: 0.7,
  },
  saturationBoost: 0,
  vibranceBoost: 0,
};

/** Diane Arbus — Flat Grey Gaze
 *  Eerily flat, grey, low-contrast tonality. No romantic blacks.
 *  Everything rendered at a clinical midtone — subjects can't hide.
 *  Heavy grain from Mamiya medium format + flash + pushed film.
 */
const ARBUS_FLAT: FilmPreset = {
  id: 'arbus-flat',
  name: 'Arbus',
  category: 'Black & White',
  description: 'Diane Arbus — Clinical flat tones, lifted blacks, grey everything. Subjects are exposed, nowhere to hide.',
  useCase: 'Intimate portraits, social documentary, street, confrontational subjects, flash photography',
  colorMatrix: [
    // Even conversion — no filter bias, equal clinical weight
    0.22, 0.70, 0.08, 0, 0,
    0.22, 0.70, 0.08, 0, 0,
    0.22, 0.70, 0.08, 0, 0,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.15,        // Heavily lifted — no deep blacks
      whitePoint: 0.90,        // Compressed whites — no bright highlight glow
      shadowContrast: 0.32,    // Very low — flat throughout
      highlightRolloff: 0.70,  // Gradual — nothing pops
      midtonePivot: 0.52,
    },
    red: { blackPoint: 0.15, whitePoint: 0.90, shadowContrast: 0.33, highlightRolloff: 0.68, midtonePivot: 0.52 },
    green: { blackPoint: 0.15, whitePoint: 0.90, shadowContrast: 0.32, highlightRolloff: 0.70, midtonePivot: 0.52 },
    blue: { blackPoint: 0.16, whitePoint: 0.90, shadowContrast: 0.31, highlightRolloff: 0.71, midtonePivot: 0.53 },
  },
  splitTone: {
    shadowHue: 200,            // Slight cool cast — alienating, institutional
    shadowSaturation: 0.04,
    highlightHue: 200,
    highlightSaturation: 0.02,
    balance: 0,
  },
  hslAdjustments: [],
  grain: {
    intensity: 0.22,           // Heavy grain — medium format flash pushed to ISO 1600
    size: 2.0,
    luminanceResponse: 0.5,
  },
  saturationBoost: 0,
  vibranceBoost: 0,
};

/** Edward Weston — Platinum Gradient
 *  Ultra-smooth tonal gradients, micro-contrast within each zone.
 *  Vegetables, nudes, shells, rocks — every curve is perfect.
 *  Green-weighted: skin and foliage render as butter-smooth gradients.
 *  Warm palladium/platinum tone (not selenium — warmer, more organic).
 */
const PLATINUM_GRADIENT: FilmPreset = {
  id: 'platinum-gradient',
  name: 'Platinum',
  category: 'Black & White',
  description: 'Edward Weston — Buttery smooth gradients, platinum/palladium warmth. Organic textures are perfection.',
  useCase: 'Still life, nudes, macro, natural textures, shells, rock, foliage, sculptural subjects',
  colorMatrix: [
    // Green-weighted: soft skin and foliage gradients, balanced rendering
    0.20, 0.68, 0.12, 0, 0,
    0.20, 0.68, 0.12, 0, 0,
    0.20, 0.68, 0.12, 0, 0,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.03,
      whitePoint: 0.98,
      shadowContrast: 0.44,    // Gentle — shadows open into rich detail
      highlightRolloff: 0.68,  // Very gentle — highlights glow organically
      midtonePivot: 0.52,      // Slightly bright — subjects are luminous
    },
    red: { blackPoint: 0.035, whitePoint: 0.98, shadowContrast: 0.45, highlightRolloff: 0.67, midtonePivot: 0.52 },
    green: { blackPoint: 0.03, whitePoint: 0.98, shadowContrast: 0.44, highlightRolloff: 0.68, midtonePivot: 0.52 },
    blue: { blackPoint: 0.025, whitePoint: 0.975, shadowContrast: 0.43, highlightRolloff: 0.65, midtonePivot: 0.51 },
  },
  splitTone: {
    shadowHue: 32,             // Warm earthy brown shadows — palladium chemistry
    shadowSaturation: 0.08,
    highlightHue: 45,          // Creamy warm highlights
    highlightSaturation: 0.04,
    balance: -0.1,
  },
  hslAdjustments: [],
  grain: {
    intensity: 0.04,           // Barely there — 8×10 orthochromatic film
    size: 0.9,
    luminanceResponse: 0.3,
  },
  saturationBoost: 0,
  vibranceBoost: 0,
};

/** Helmut Newton — Graphic Fashion
 *  Graphic, high-contrast fashion. Skin glows white against ink-black shadows.
 *  Pools, penthouse suites, stilettos. Bold tonal blocks.
 *  Red-weighted: warm skin tones surge forward, everything else recedes.
 */
const GRAPHIC_FASHION: FilmPreset = {
  id: 'graphic-fashion',
  name: 'Graphic',
  category: 'Black & White',
  description: 'Helmut Newton — Graphic high-contrast. Skin glows, shadows are black pools. Bold fashion tonality.',
  useCase: 'Fashion, glamour, nude portraits, urban architecture, strong contrast scenes',
  colorMatrix: [
    // Heavy red bias: warm skin tones are bright, cool shadows are black
    0.50, 0.42, 0.08, 0, 0,
    0.50, 0.42, 0.08, 0, 0,
    0.50, 0.42, 0.08, 0, 0,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.01,        // Absolute black — pools of shadow
      whitePoint: 0.98,
      shadowContrast: 0.68,    // Very high — midtones snap to black quickly
      highlightRolloff: 0.45,  // Hard — highlights stay bright until they clip
      midtonePivot: 0.50,
    },
    red: { blackPoint: 0.01, whitePoint: 0.99, shadowContrast: 0.70, highlightRolloff: 0.43, midtonePivot: 0.51 },
    green: { blackPoint: 0.01, whitePoint: 0.97, shadowContrast: 0.67, highlightRolloff: 0.46, midtonePivot: 0.49 },
    blue: { blackPoint: 0.015, whitePoint: 0.95, shadowContrast: 0.65, highlightRolloff: 0.48, midtonePivot: 0.48 },
  },
  splitTone: IDENTITY_SPLIT_TONE,  // Pure neutral — Newton's prints were clean
  hslAdjustments: [],
  grain: NO_GRAIN,                  // Studio strobes — grain is weakness
  saturationBoost: 0,
  vibranceBoost: 0,
};

// =============================================================================
// CREATIVE (2 presets)
// =============================================================================

const AUTUMN_PALETTE: FilmPreset = {
  id: 'autumn-palette',
  name: 'Autumn',
  category: 'Creative',
  description: 'Enhances warm earth tones, rich oranges and reds, muted greens shifting to gold.',
  useCase: 'Fall foliage, autumn portraits, warm nature, harvest scenes',
  colorMatrix: [
    1.08, 0.04, 0, 0, 0.01,
    0.01, 1.02, 0, 0, 0.005,
    0, 0, 0.90, 0, 0,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.04,
      whitePoint: 0.97,
      shadowContrast: 0.50,
      highlightRolloff: 0.60,
      midtonePivot: 0.50,
    },
    red: {
      blackPoint: 0.045,
      whitePoint: 0.98,
      shadowContrast: 0.52,
      highlightRolloff: 0.62,
      midtonePivot: 0.52,
    },
    green: {
      blackPoint: 0.04,
      whitePoint: 0.96,
      shadowContrast: 0.50,
      highlightRolloff: 0.58,
      midtonePivot: 0.49,
    },
    blue: {
      blackPoint: 0.035,
      whitePoint: 0.94,
      shadowContrast: 0.52,
      highlightRolloff: 0.55,
      midtonePivot: 0.48,
    },
  },
  splitTone: {
    shadowHue: 25,
    shadowSaturation: 0.10,
    highlightHue: 40,
    highlightSaturation: 0.08,
    balance: 0.1,
  },
  hslAdjustments: [
    { hueCenter: 0, hueRange: 30, hueShift: 5, saturationMult: 1.20, luminanceShift: 0.02 },    // Reds: rich
    { hueCenter: 30, hueRange: 30, hueShift: -3, saturationMult: 1.25, luminanceShift: 0.02 },   // Oranges: boosted — key color
    { hueCenter: 60, hueRange: 30, hueShift: -10, saturationMult: 1.15, luminanceShift: 0.01 },  // Yellows: push toward gold
    { hueCenter: 120, hueRange: 50, hueShift: -25, saturationMult: 0.80, luminanceShift: -0.02 },// Greens: shift to yellow-brown, mute
    { hueCenter: 210, hueRange: 40, hueShift: 0, saturationMult: 0.85, luminanceShift: -0.01 },  // Blues: muted
  ],
  grain: {
    intensity: 0.03,
    size: 1.0,
    luminanceResponse: 0.4,
  },
  saturationBoost: 1.08,
  vibranceBoost: 1.12,
};

const CROSS_PROCESS: FilmPreset = {
  id: 'cross-process',
  name: 'Cross',
  category: 'Creative',
  description: 'Slide film developed in C-41 chemistry. Wild color shifts, high contrast, unpredictable.',
  useCase: 'Creative, experimental, lo-fi, retro, fun snapshots',
  colorMatrix: [
    1.15, 0.05, -0.05, 0, 0,
    -0.05, 1.10, 0.05, 0, 0.01,
    0.05, -0.08, 1.20, 0, 0.02,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.03,
      whitePoint: 0.96,
      shadowContrast: 0.62,   // High contrast
      highlightRolloff: 0.42,
      midtonePivot: 0.48,
    },
    red: {
      blackPoint: 0.02,
      whitePoint: 0.98,       // Red channel opens up
      shadowContrast: 0.65,
      highlightRolloff: 0.40,
      midtonePivot: 0.50,
    },
    green: {
      blackPoint: 0.04,
      whitePoint: 0.95,
      shadowContrast: 0.58,
      highlightRolloff: 0.45,
      midtonePivot: 0.47,
    },
    blue: {
      blackPoint: 0.06,       // Blue shift in shadows
      whitePoint: 0.92,       // Blue clipped in highlights — yellow cast
      shadowContrast: 0.60,
      highlightRolloff: 0.38,
      midtonePivot: 0.46,
    },
  },
  splitTone: {
    shadowHue: 270,           // Purple shadows
    shadowSaturation: 0.12,
    highlightHue: 55,         // Yellow-green highlights
    highlightSaturation: 0.14,
    balance: 0.1,
  },
  hslAdjustments: [
    { hueCenter: 120, hueRange: 40, hueShift: -15, saturationMult: 1.30, luminanceShift: 0.04 }, // Greens: yellow shift, saturated
    { hueCenter: 210, hueRange: 40, hueShift: 15, saturationMult: 1.20, luminanceShift: 0.03 },  // Blues: purple shift
    { hueCenter: 0, hueRange: 30, hueShift: 10, saturationMult: 1.15, luminanceShift: 0.02 },    // Reds: orange shift
  ],
  grain: {
    intensity: 0.08,
    size: 1.4,
    luminanceResponse: 0.5,
  },
  saturationBoost: 1.0,       // Tone curves + HSL hue shifts already make this extreme
  vibranceBoost: 1.04,
};

// =============================================================================
// LANDSCAPE — NEW (5 more presets)
// =============================================================================

const ALPINE_CLARITY: FilmPreset = {
  id: 'alpine-clarity',
  name: 'Alpine',
  category: 'Landscape',
  description: 'Minimalist high-contrast clarity. Clean whites, deep shadows, razor-sharp tonal separation. Mountain, lake, snow.',
  useCase: 'Mountains, alpine lakes, snow, minimalist compositions, any light',
  colorMatrix: [
    1.02, 0, 0, 0, -0.01,
    0, 1.01, 0, 0, -0.01,
    0, 0.01, 1.04, 0, 0,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.01,
      whitePoint: 0.99,
      shadowContrast: 0.62,
      highlightRolloff: 0.48,
      midtonePivot: 0.48,
    },
    red: {
      blackPoint: 0.01,
      whitePoint: 0.99,
      shadowContrast: 0.61,
      highlightRolloff: 0.48,
      midtonePivot: 0.48,
    },
    green: {
      blackPoint: 0.01,
      whitePoint: 0.99,
      shadowContrast: 0.62,
      highlightRolloff: 0.49,
      midtonePivot: 0.48,
    },
    blue: {
      blackPoint: 0.015,
      whitePoint: 0.98,
      shadowContrast: 0.63,
      highlightRolloff: 0.50,
      midtonePivot: 0.49,
    },
  },
  splitTone: {
    shadowHue: 215,
    shadowSaturation: 0.04,
    highlightHue: 40,
    highlightSaturation: 0.02,
    balance: 0,
  },
  hslAdjustments: [
    { hueCenter: 210, hueRange: 50, hueShift: 0, saturationMult: 1.10, luminanceShift: -0.03 },
    { hueCenter: 120, hueRange: 40, hueShift: 0, saturationMult: 0.92, luminanceShift: -0.01 },
  ],
  grain: NO_GRAIN,
  saturationBoost: 0.97,
  vibranceBoost: 1.06,
};

const DESERT_GLOW: FilmPreset = {
  id: 'desert-glow',
  name: 'Desert',
  category: 'Landscape',
  description: 'Warm earth palette, dramatic contrast, golden highlights. Built for harsh midday light and sand/rock textures.',
  useCase: 'Desert, canyons, sand dunes, arid landscapes, midday sun',
  colorMatrix: [
    1.08, 0.03, 0, 0, 0.01,
    0.01, 1.03, 0, 0, 0,
    0, 0, 0.88, 0, -0.01,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.02,
      whitePoint: 0.97,
      shadowContrast: 0.60,
      highlightRolloff: 0.52,
      midtonePivot: 0.50,
    },
    red: {
      blackPoint: 0.025,
      whitePoint: 0.98,
      shadowContrast: 0.58,
      highlightRolloff: 0.55,
      midtonePivot: 0.52,
    },
    green: {
      blackPoint: 0.02,
      whitePoint: 0.97,
      shadowContrast: 0.59,
      highlightRolloff: 0.52,
      midtonePivot: 0.50,
    },
    blue: {
      blackPoint: 0.015,
      whitePoint: 0.93,
      shadowContrast: 0.62,
      highlightRolloff: 0.48,
      midtonePivot: 0.48,
    },
  },
  splitTone: {
    shadowHue: 30,
    shadowSaturation: 0.12,
    highlightHue: 45,
    highlightSaturation: 0.10,
    balance: 0.15,
  },
  hslAdjustments: [
    { hueCenter: 30, hueRange: 40, hueShift: -5, saturationMult: 1.22, luminanceShift: 0.02 },
    { hueCenter: 60, hueRange: 30, hueShift: -8, saturationMult: 1.15, luminanceShift: 0.01 },
    { hueCenter: 210, hueRange: 50, hueShift: 0, saturationMult: 0.80, luminanceShift: -0.03 },
  ],
  grain: NO_GRAIN,
  saturationBoost: 1.05,
  vibranceBoost: 1.10,
};

const NORDIC_BLUE: FilmPreset = {
  id: 'nordic-blue',
  name: 'Nordic',
  category: 'Landscape',
  description: 'Cool atmospheric blue hour tones, ethereal lifted shadows. Overcast and twilight specialist.',
  useCase: 'Blue hour, overcast skies, fog, Nordic/Scandinavian landscapes, moody water',
  colorMatrix: [
    0.97, 0.01, 0.02, 0, 0,
    0.01, 0.98, 0.02, 0, 0.01,
    0.02, 0.03, 1.06, 0, 0.02,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.08,
      whitePoint: 0.95,
      shadowContrast: 0.42,
      highlightRolloff: 0.65,
      midtonePivot: 0.52,
    },
    red: {
      blackPoint: 0.07,
      whitePoint: 0.95,
      shadowContrast: 0.43,
      highlightRolloff: 0.63,
      midtonePivot: 0.51,
    },
    green: {
      blackPoint: 0.08,
      whitePoint: 0.96,
      shadowContrast: 0.42,
      highlightRolloff: 0.65,
      midtonePivot: 0.52,
    },
    blue: {
      blackPoint: 0.10,
      whitePoint: 0.95,
      shadowContrast: 0.40,
      highlightRolloff: 0.67,
      midtonePivot: 0.53,
    },
  },
  splitTone: {
    shadowHue: 215,
    shadowSaturation: 0.14,
    highlightHue: 200,
    highlightSaturation: 0.06,
    balance: -0.15,
  },
  hslAdjustments: [
    { hueCenter: 210, hueRange: 50, hueShift: -5, saturationMult: 1.12, luminanceShift: 0 },
    { hueCenter: 180, hueRange: 35, hueShift: 0, saturationMult: 1.08, luminanceShift: 0.02 },
    { hueCenter: 30, hueRange: 30, hueShift: 0, saturationMult: 0.80, luminanceShift: 0 },
    { hueCenter: 0, hueRange: 25, hueShift: 0, saturationMult: 0.75, luminanceShift: 0 },
  ],
  grain: {
    intensity: 0.03,
    size: 1.1,
    luminanceResponse: 0.3,
  },
  saturationBoost: 0.88,
  vibranceBoost: 1.02,
};

const DEEP_FOREST: FilmPreset = {
  id: 'deep-forest',
  name: 'Forest',
  category: 'Landscape',
  description: 'Rich emerald greens, deep organic shadows, lush canopy feel. Forest and jungle specialist.',
  useCase: 'Forests, jungles, trails, waterfalls, fern close-ups, moss',
  colorMatrix: [
    0.98, 0, 0, 0, -0.01,
    0.02, 1.06, 0, 0, 0,
    0, 0.02, 0.96, 0, 0,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.03,
      whitePoint: 0.96,
      shadowContrast: 0.58,
      highlightRolloff: 0.55,
      midtonePivot: 0.46,
    },
    red: {
      blackPoint: 0.03,
      whitePoint: 0.95,
      shadowContrast: 0.56,
      highlightRolloff: 0.54,
      midtonePivot: 0.45,
    },
    green: {
      blackPoint: 0.03,
      whitePoint: 0.97,
      shadowContrast: 0.57,
      highlightRolloff: 0.56,
      midtonePivot: 0.47,
    },
    blue: {
      blackPoint: 0.035,
      whitePoint: 0.94,
      shadowContrast: 0.55,
      highlightRolloff: 0.53,
      midtonePivot: 0.45,
    },
  },
  splitTone: {
    shadowHue: 150,
    shadowSaturation: 0.08,
    highlightHue: 55,
    highlightSaturation: 0.06,
    balance: -0.1,
  },
  hslAdjustments: [
    { hueCenter: 120, hueRange: 50, hueShift: -5, saturationMult: 1.25, luminanceShift: 0.02 },
    { hueCenter: 80, hueRange: 30, hueShift: -5, saturationMult: 1.15, luminanceShift: 0.01 },
    { hueCenter: 30, hueRange: 25, hueShift: 0, saturationMult: 1.10, luminanceShift: 0.02 },
    { hueCenter: 210, hueRange: 40, hueShift: 10, saturationMult: 0.85, luminanceShift: -0.02 },
  ],
  grain: NO_GRAIN,
  saturationBoost: 1.06,
  vibranceBoost: 1.12,
};

const COASTAL_DRAMA: FilmPreset = {
  id: 'coastal-drama',
  name: 'Coastal',
  category: 'Landscape',
  description: 'Moody teal water, dramatic sky contrast, deep blacks. Seascapes and coastal rock formations.',
  useCase: 'Ocean, sea cliffs, lighthouses, coastal long exposure, rocky shores',
  colorMatrix: [
    0.98, 0, -0.01, 0, -0.01,
    0, 0.99, 0.02, 0, -0.01,
    -0.02, 0.04, 1.08, 0, 0.01,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.02,
      whitePoint: 0.97,
      shadowContrast: 0.64,
      highlightRolloff: 0.46,
      midtonePivot: 0.46,
    },
    red: {
      blackPoint: 0.02,
      whitePoint: 0.96,
      shadowContrast: 0.62,
      highlightRolloff: 0.45,
      midtonePivot: 0.45,
    },
    green: {
      blackPoint: 0.02,
      whitePoint: 0.97,
      shadowContrast: 0.63,
      highlightRolloff: 0.47,
      midtonePivot: 0.46,
    },
    blue: {
      blackPoint: 0.025,
      whitePoint: 0.97,
      shadowContrast: 0.65,
      highlightRolloff: 0.48,
      midtonePivot: 0.47,
    },
  },
  splitTone: {
    shadowHue: 195,
    shadowSaturation: 0.14,
    highlightHue: 210,
    highlightSaturation: 0.04,
    balance: -0.1,
  },
  hslAdjustments: [
    { hueCenter: 190, hueRange: 45, hueShift: -5, saturationMult: 1.20, luminanceShift: -0.02 },
    { hueCenter: 210, hueRange: 45, hueShift: 0, saturationMult: 1.15, luminanceShift: -0.04 },
    { hueCenter: 30, hueRange: 30, hueShift: 0, saturationMult: 0.85, luminanceShift: 0 },
    { hueCenter: 120, hueRange: 40, hueShift: 10, saturationMult: 0.80, luminanceShift: -0.02 },
  ],
  grain: {
    intensity: 0.04,
    size: 1.2,
    luminanceResponse: 0.5,
  },
  saturationBoost: 0.96,
  vibranceBoost: 1.08,
};

// =============================================================================
// PORTRAIT — NEW (4 more presets)
// =============================================================================

const CLEAN_MINIMAL: FilmPreset = {
  id: 'clean-minimal',
  name: 'Minimal',
  category: 'Portrait',
  description: 'Ultra-clean, true-to-life skin. Barely there color grading — lets the subject speak. Minimalist philosophy.',
  useCase: 'Clean headshots, minimal portraits, studio, natural light, editorial minimalism',
  colorMatrix: [
    1.01, 0.005, 0, 0, 0.005,
    0.005, 1.005, 0, 0, 0.005,
    0, 0, 0.99, 0, 0.008,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.04,
      whitePoint: 0.99,
      shadowContrast: 0.46,
      highlightRolloff: 0.65,
      midtonePivot: 0.52,
    },
    red: {
      blackPoint: 0.04,
      whitePoint: 0.99,
      shadowContrast: 0.47,
      highlightRolloff: 0.64,
      midtonePivot: 0.52,
    },
    green: {
      blackPoint: 0.04,
      whitePoint: 0.99,
      shadowContrast: 0.46,
      highlightRolloff: 0.65,
      midtonePivot: 0.52,
    },
    blue: {
      blackPoint: 0.038,
      whitePoint: 0.98,
      shadowContrast: 0.45,
      highlightRolloff: 0.64,
      midtonePivot: 0.51,
    },
  },
  splitTone: {
    shadowHue: 25,
    shadowSaturation: 0.03,
    highlightHue: 40,
    highlightSaturation: 0.02,
    balance: 0,
  },
  hslAdjustments: [
    { hueCenter: 15, hueRange: 35, hueShift: 0, saturationMult: 1.02, luminanceShift: 0.02 },
    { hueCenter: 35, hueRange: 25, hueShift: 0, saturationMult: 1.0, luminanceShift: 0.01 },
  ],
  grain: NO_GRAIN,
  saturationBoost: 0.98,
  vibranceBoost: 1.01,
};

const STUDIO_POWER: FilmPreset = {
  id: 'studio-power',
  name: 'Studio',
  category: 'Portrait',
  description: 'High contrast dramatic studio look. Deep blacks, bright skin, powerful tonal separation. Fashion and commercial.',
  useCase: 'Studio portraits, fashion, headshots with dramatic lighting, commercial',
  colorMatrix: [
    1.04, 0.01, 0, 0, -0.01,
    0, 1.01, 0, 0, -0.01,
    0, 0.01, 1.02, 0, 0,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.01,
      whitePoint: 0.98,
      shadowContrast: 0.65,
      highlightRolloff: 0.45,
      midtonePivot: 0.47,
    },
    red: {
      blackPoint: 0.01,
      whitePoint: 0.98,
      shadowContrast: 0.64,
      highlightRolloff: 0.46,
      midtonePivot: 0.48,
    },
    green: {
      blackPoint: 0.01,
      whitePoint: 0.98,
      shadowContrast: 0.65,
      highlightRolloff: 0.45,
      midtonePivot: 0.47,
    },
    blue: {
      blackPoint: 0.015,
      whitePoint: 0.97,
      shadowContrast: 0.63,
      highlightRolloff: 0.47,
      midtonePivot: 0.47,
    },
  },
  splitTone: {
    shadowHue: 230,
    shadowSaturation: 0.05,
    highlightHue: 35,
    highlightSaturation: 0.03,
    balance: 0.1,
  },
  hslAdjustments: [
    { hueCenter: 15, hueRange: 30, hueShift: 0, saturationMult: 1.02, luminanceShift: 0.03 },
    { hueCenter: 35, hueRange: 25, hueShift: -2, saturationMult: 0.98, luminanceShift: 0.02 },
    { hueCenter: 120, hueRange: 40, hueShift: 0, saturationMult: 0.82, luminanceShift: -0.02 },
    { hueCenter: 210, hueRange: 40, hueShift: 0, saturationMult: 0.85, luminanceShift: -0.01 },
  ],
  grain: NO_GRAIN,
  saturationBoost: 0.96,
  vibranceBoost: 1.04,
};

const WARM_GLOW: FilmPreset = {
  id: 'warm-glow',
  name: 'Warm Glow',
  category: 'Portrait',
  description: 'Intimate warm tones, soft golden light feel. Flattering skin in all tones. Couples, family, golden hour portraits.',
  useCase: 'Couples, family, maternity, engagement, golden hour portraits',
  colorMatrix: [
    1.05, 0.02, 0, 0, 0.012,
    0.01, 1.02, 0, 0, 0.008,
    0, 0, 0.94, 0, 0.015,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.05,
      whitePoint: 0.98,
      shadowContrast: 0.42,
      highlightRolloff: 0.68,
      midtonePivot: 0.52,
    },
    red: {
      blackPoint: 0.055,
      whitePoint: 0.98,
      shadowContrast: 0.44,
      highlightRolloff: 0.66,
      midtonePivot: 0.53,
    },
    green: {
      blackPoint: 0.05,
      whitePoint: 0.98,
      shadowContrast: 0.42,
      highlightRolloff: 0.68,
      midtonePivot: 0.52,
    },
    blue: {
      blackPoint: 0.045,
      whitePoint: 0.97,
      shadowContrast: 0.43,
      highlightRolloff: 0.65,
      midtonePivot: 0.51,
    },
  },
  splitTone: {
    shadowHue: 25,
    shadowSaturation: 0.10,
    highlightHue: 40,
    highlightSaturation: 0.08,
    balance: 0.1,
  },
  hslAdjustments: [
    { hueCenter: 15, hueRange: 35, hueShift: 2, saturationMult: 1.06, luminanceShift: 0.03 },
    { hueCenter: 35, hueRange: 25, hueShift: -3, saturationMult: 1.04, luminanceShift: 0.02 },
    { hueCenter: 55, hueRange: 20, hueShift: -5, saturationMult: 0.92, luminanceShift: 0 },
    { hueCenter: 120, hueRange: 40, hueShift: 0, saturationMult: 0.85, luminanceShift: 0 },
  ],
  grain: {
    intensity: 0.025,
    size: 0.9,
    luminanceResponse: 0.5,
  },
  saturationBoost: 0.97,
  vibranceBoost: 1.04,
};

const BACKLIT_PORTRAIT: FilmPreset = {
  id: 'backlit-portrait',
  name: 'Backlit',
  category: 'Portrait',
  description: 'Optimized for backlight situations. Lifted shadows reveal face detail, warm rim light glow. Dreamy but defined.',
  useCase: 'Backlit portraits, rim light, sun flare, golden hour from behind',
  colorMatrix: [
    1.03, 0.01, 0, 0, 0.02,
    0.01, 1.02, 0.01, 0, 0.015,
    0, 0.01, 0.97, 0, 0.025,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.10,
      whitePoint: 0.98,
      shadowContrast: 0.36,
      highlightRolloff: 0.72,
      midtonePivot: 0.54,
    },
    red: {
      blackPoint: 0.105,
      whitePoint: 0.98,
      shadowContrast: 0.38,
      highlightRolloff: 0.70,
      midtonePivot: 0.55,
    },
    green: {
      blackPoint: 0.10,
      whitePoint: 0.98,
      shadowContrast: 0.36,
      highlightRolloff: 0.72,
      midtonePivot: 0.54,
    },
    blue: {
      blackPoint: 0.095,
      whitePoint: 0.97,
      shadowContrast: 0.35,
      highlightRolloff: 0.70,
      midtonePivot: 0.53,
    },
  },
  splitTone: {
    shadowHue: 30,
    shadowSaturation: 0.08,
    highlightHue: 45,
    highlightSaturation: 0.10,
    balance: 0.2,
  },
  hslAdjustments: [
    { hueCenter: 15, hueRange: 35, hueShift: 0, saturationMult: 1.04, luminanceShift: 0.04 },
    { hueCenter: 50, hueRange: 25, hueShift: -5, saturationMult: 1.10, luminanceShift: 0.03 },
    { hueCenter: 210, hueRange: 40, hueShift: 0, saturationMult: 0.82, luminanceShift: 0 },
  ],
  grain: {
    intensity: 0.03,
    size: 1.0,
    luminanceResponse: 0.5,
  },
  saturationBoost: 0.97,
  vibranceBoost: 1.03,
};

// =============================================================================
// LANDSCAPE — BATCH 2 (8 more presets → total 16)
// =============================================================================

const BLUE_HOUR: FilmPreset = {
  id: 'blue-hour',
  name: 'Blue Hour',
  category: 'Landscape',
  description: 'Deep twilight blues and purples. City skylines, reflections, that magical 20-minute window after sunset.',
  useCase: 'Blue hour, city at dusk, water reflections, twilight, bridges',
  colorMatrix: [
    0.90, 0.02, 0.05, 0, 0,
    0.01, 0.96, 0.04, 0, 0.01,
    0.02, 0.04, 1.12, 0, 0.02,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.06,
      whitePoint: 0.95,
      shadowContrast: 0.48,
      highlightRolloff: 0.62,
      midtonePivot: 0.50,
    },
    red:   { blackPoint: 0.055, whitePoint: 0.94, shadowContrast: 0.47, highlightRolloff: 0.60, midtonePivot: 0.49 },
    green: { blackPoint: 0.060, whitePoint: 0.95, shadowContrast: 0.48, highlightRolloff: 0.62, midtonePivot: 0.50 },
    blue:  { blackPoint: 0.075, whitePoint: 0.96, shadowContrast: 0.46, highlightRolloff: 0.65, midtonePivot: 0.51 },
  },
  splitTone: {
    shadowHue: 230,
    shadowSaturation: 0.18,
    highlightHue: 220,
    highlightSaturation: 0.08,
    balance: -0.1,
  },
  hslAdjustments: [
    { hueCenter: 210, hueRange: 50, hueShift: -5, saturationMult: 1.18, luminanceShift: -0.02 },
    { hueCenter: 270, hueRange: 40, hueShift: 0,  saturationMult: 1.10, luminanceShift: 0 },
    { hueCenter: 30,  hueRange: 35, hueShift: 0,  saturationMult: 0.78, luminanceShift: 0 },
    { hueCenter: 0,   hueRange: 25, hueShift: 0,  saturationMult: 0.75, luminanceShift: 0 },
  ],
  grain: { intensity: 0.04, size: 1.1, luminanceResponse: 0.4 },
  saturationBoost: 0.95,
  vibranceBoost: 1.06,
};

const SUNRISE_CRIMSON: FilmPreset = {
  id: 'sunrise-crimson',
  name: 'Crimson',
  category: 'Landscape',
  description: 'Pre-dawn deep reds, crimson clouds, dark silhouetted ground. Maximum drama at first light.',
  useCase: 'Pre-dawn, volcanic sky, crimson sunrise, dramatic red clouds',
  colorMatrix: [
    1.14, 0.02, -0.02, 0, 0.01,
    0.01, 1.02,  0.00, 0, -0.01,
    0,    0,     0.86, 0, -0.02,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.01,
      whitePoint: 0.97,
      shadowContrast: 0.66,
      highlightRolloff: 0.44,
      midtonePivot: 0.46,
    },
    red:   { blackPoint: 0.01, whitePoint: 0.99, shadowContrast: 0.65, highlightRolloff: 0.45, midtonePivot: 0.48 },
    green: { blackPoint: 0.01, whitePoint: 0.96, shadowContrast: 0.64, highlightRolloff: 0.43, midtonePivot: 0.46 },
    blue:  { blackPoint: 0.02, whitePoint: 0.90, shadowContrast: 0.68, highlightRolloff: 0.38, midtonePivot: 0.44 },
  },
  splitTone: {
    shadowHue: 5,
    shadowSaturation: 0.14,
    highlightHue: 25,
    highlightSaturation: 0.10,
    balance: 0.0,
  },
  hslAdjustments: [
    { hueCenter: 0,   hueRange: 30, hueShift: -5, saturationMult: 1.28, luminanceShift: 0.03 },
    { hueCenter: 345, hueRange: 25, hueShift: 0,  saturationMult: 1.22, luminanceShift: 0.02 },
    { hueCenter: 210, hueRange: 50, hueShift: 0,  saturationMult: 0.80, luminanceShift: -0.04 },
    { hueCenter: 120, hueRange: 40, hueShift: 0,  saturationMult: 0.75, luminanceShift: -0.02 },
  ],
  grain: { intensity: 0.05, size: 1.3, luminanceResponse: 0.5 },
  saturationBoost: 1.05,
  vibranceBoost: 1.08,
};

const OVERCAST_MOOD: FilmPreset = {
  id: 'overcast-mood',
  name: 'Overcast',
  category: 'Landscape',
  description: 'Flat diffuse light turned to an asset. Muted palette, strong texture, atmospheric depth. No blown skies.',
  useCase: 'Overcast days, texture-heavy subjects, stone/rock, architecture, winter fields',
  colorMatrix: [
    0.99, 0.01, 0.01, 0, -0.01,
    0.01, 0.99, 0.01, 0, -0.01,
    0.01, 0.01, 1.01, 0, 0.00,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.03,
      whitePoint: 0.96,
      shadowContrast: 0.58,
      highlightRolloff: 0.52,
      midtonePivot: 0.48,
    },
    red:   { blackPoint: 0.03, whitePoint: 0.96, shadowContrast: 0.57, highlightRolloff: 0.51, midtonePivot: 0.48 },
    green: { blackPoint: 0.03, whitePoint: 0.96, shadowContrast: 0.58, highlightRolloff: 0.52, midtonePivot: 0.48 },
    blue:  { blackPoint: 0.03, whitePoint: 0.97, shadowContrast: 0.57, highlightRolloff: 0.53, midtonePivot: 0.48 },
  },
  splitTone: {
    shadowHue: 210,
    shadowSaturation: 0.05,
    highlightHue: 200,
    highlightSaturation: 0.02,
    balance: 0,
  },
  hslAdjustments: [
    { hueCenter: 120, hueRange: 50, hueShift: 0, saturationMult: 0.85, luminanceShift: -0.01 },
    { hueCenter: 60,  hueRange: 30, hueShift: 0, saturationMult: 0.80, luminanceShift: -0.01 },
    { hueCenter: 30,  hueRange: 30, hueShift: 0, saturationMult: 0.82, luminanceShift: 0 },
    { hueCenter: 210, hueRange: 50, hueShift: 0, saturationMult: 0.88, luminanceShift: 0 },
  ],
  grain: { intensity: 0.04, size: 1.1, luminanceResponse: 0.45 },
  saturationBoost: 0.84,
  vibranceBoost: 1.02,
};

const WINTER_WHITE: FilmPreset = {
  id: 'winter-white',
  name: 'Winter',
  category: 'Landscape',
  description: 'Icy cold, high-key minimalism. Snow becomes pure white, shadows turn steel blue. Clean and stark.',
  useCase: 'Snow, ice, frozen lakes, winter mountains, frost, white landscapes',
  colorMatrix: [
    0.96, 0.01, 0.02, 0, 0.01,
    0.01, 0.97, 0.02, 0, 0.01,
    0.01, 0.02, 1.08, 0, 0.02,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.04,
      whitePoint: 1.00,
      shadowContrast: 0.44,
      highlightRolloff: 0.52,
      midtonePivot: 0.52,
    },
    red:   { blackPoint: 0.04, whitePoint: 0.99, shadowContrast: 0.43, highlightRolloff: 0.50, midtonePivot: 0.51 },
    green: { blackPoint: 0.04, whitePoint: 1.00, shadowContrast: 0.44, highlightRolloff: 0.52, midtonePivot: 0.52 },
    blue:  { blackPoint: 0.05, whitePoint: 1.00, shadowContrast: 0.42, highlightRolloff: 0.54, midtonePivot: 0.53 },
  },
  splitTone: {
    shadowHue: 215,
    shadowSaturation: 0.12,
    highlightHue: 200,
    highlightSaturation: 0.03,
    balance: -0.15,
  },
  hslAdjustments: [
    { hueCenter: 210, hueRange: 50, hueShift: 0, saturationMult: 1.08, luminanceShift: 0.02 },
    { hueCenter: 30,  hueRange: 40, hueShift: 0, saturationMult: 0.70, luminanceShift: 0.02 },
    { hueCenter: 0,   hueRange: 25, hueShift: 0, saturationMult: 0.65, luminanceShift: 0.01 },
    { hueCenter: 120, hueRange: 40, hueShift: 0, saturationMult: 0.68, luminanceShift: 0.01 },
  ],
  grain: { intensity: 0.02, size: 0.9, luminanceResponse: 0.3 },
  saturationBoost: 0.76,
  vibranceBoost: 0.95,
};

const MONSOON_GREEN: FilmPreset = {
  id: 'monsoon-green',
  name: 'Monsoon',
  category: 'Landscape',
  description: 'Post-rain lushness. Oversaturated emerald greens, dark dramatic sky, wet-surface reflections.',
  useCase: 'Tropical, monsoon, jungle after rain, wet streets, rice paddies, lush canopy',
  colorMatrix: [
    0.96, 0.01, 0,    0, -0.01,
    0.02, 1.08, 0,    0, 0,
    0,    0.02, 1.02, 0, 0,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.02,
      whitePoint: 0.96,
      shadowContrast: 0.60,
      highlightRolloff: 0.50,
      midtonePivot: 0.47,
    },
    red:   { blackPoint: 0.02, whitePoint: 0.95, shadowContrast: 0.58, highlightRolloff: 0.49, midtonePivot: 0.46 },
    green: { blackPoint: 0.02, whitePoint: 0.97, shadowContrast: 0.60, highlightRolloff: 0.52, midtonePivot: 0.48 },
    blue:  { blackPoint: 0.02, whitePoint: 0.96, shadowContrast: 0.61, highlightRolloff: 0.50, midtonePivot: 0.47 },
  },
  splitTone: {
    shadowHue: 150,
    shadowSaturation: 0.10,
    highlightHue: 180,
    highlightSaturation: 0.04,
    balance: -0.1,
  },
  hslAdjustments: [
    { hueCenter: 120, hueRange: 50, hueShift: -8, saturationMult: 1.30, luminanceShift: 0.02 },
    { hueCenter: 80,  hueRange: 30, hueShift: -5, saturationMult: 1.22, luminanceShift: 0.01 },
    { hueCenter: 180, hueRange: 35, hueShift: 0,  saturationMult: 1.14, luminanceShift: -0.02 },
    { hueCenter: 210, hueRange: 45, hueShift: 0,  saturationMult: 1.10, luminanceShift: -0.04 },
    { hueCenter: 30,  hueRange: 30, hueShift: 0,  saturationMult: 0.80, luminanceShift: 0 },
  ],
  grain: { intensity: 0.03, size: 1.0, luminanceResponse: 0.4 },
  saturationBoost: 1.06,
  vibranceBoost: 1.14,
};

const CANYON_RED: FilmPreset = {
  id: 'canyon-red',
  name: 'Canyon',
  category: 'Landscape',
  description: 'Warm terracotta and sandstone reds. Deep shadow crevices, strong texture contrast. US Southwest aesthetic.',
  useCase: 'Canyons, red rock, Utah/Arizona, desert arches, sandstone cliffs, arid textures',
  colorMatrix: [
    1.12, 0.04, -0.02, 0, 0.01,
    0.01, 1.03,  0,    0, -0.01,
    0,    0,     0.84, 0, -0.02,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.02,
      whitePoint: 0.97,
      shadowContrast: 0.64,
      highlightRolloff: 0.48,
      midtonePivot: 0.48,
    },
    red:   { blackPoint: 0.025, whitePoint: 0.98, shadowContrast: 0.62, highlightRolloff: 0.50, midtonePivot: 0.50 },
    green: { blackPoint: 0.020, whitePoint: 0.96, shadowContrast: 0.63, highlightRolloff: 0.47, midtonePivot: 0.47 },
    blue:  { blackPoint: 0.015, whitePoint: 0.90, shadowContrast: 0.66, highlightRolloff: 0.42, midtonePivot: 0.45 },
  },
  splitTone: {
    shadowHue: 15,
    shadowSaturation: 0.14,
    highlightHue: 38,
    highlightSaturation: 0.10,
    balance: 0.05,
  },
  hslAdjustments: [
    { hueCenter: 15,  hueRange: 35, hueShift: -3, saturationMult: 1.28, luminanceShift: 0.02 },
    { hueCenter: 30,  hueRange: 35, hueShift: -5, saturationMult: 1.24, luminanceShift: 0.02 },
    { hueCenter: 60,  hueRange: 25, hueShift: -8, saturationMult: 1.10, luminanceShift: 0.01 },
    { hueCenter: 120, hueRange: 40, hueShift: 0,  saturationMult: 0.78, luminanceShift: -0.03 },
    { hueCenter: 210, hueRange: 50, hueShift: 0,  saturationMult: 0.75, luminanceShift: -0.04 },
  ],
  grain: { intensity: 0.04, size: 1.2, luminanceResponse: 0.4 },
  saturationBoost: 1.05,
  vibranceBoost: 1.10,
};

const OCEAN_HORIZON: FilmPreset = {
  id: 'ocean-horizon',
  name: 'Ocean',
  category: 'Landscape',
  description: 'Clean two-tone seascape. Pure blue water, white sky, minimal visual noise. Calm and graphic.',
  useCase: 'Open ocean, flat water, minimalist seascapes, horizon shots, boats',
  colorMatrix: [
    0.96, 0.01, 0.02, 0, -0.01,
    0.01, 1.00, 0.02, 0, 0.00,
    0.01, 0.02, 1.06, 0, 0.01,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.02,
      whitePoint: 0.99,
      shadowContrast: 0.56,
      highlightRolloff: 0.56,
      midtonePivot: 0.50,
    },
    red:   { blackPoint: 0.02, whitePoint: 0.98, shadowContrast: 0.55, highlightRolloff: 0.55, midtonePivot: 0.49 },
    green: { blackPoint: 0.02, whitePoint: 0.99, shadowContrast: 0.56, highlightRolloff: 0.56, midtonePivot: 0.50 },
    blue:  { blackPoint: 0.02, whitePoint: 0.99, shadowContrast: 0.57, highlightRolloff: 0.58, midtonePivot: 0.51 },
  },
  splitTone: {
    shadowHue: 200,
    shadowSaturation: 0.10,
    highlightHue: 210,
    highlightSaturation: 0.03,
    balance: -0.1,
  },
  hslAdjustments: [
    { hueCenter: 195, hueRange: 45, hueShift: -3, saturationMult: 1.16, luminanceShift: -0.01 },
    { hueCenter: 210, hueRange: 45, hueShift: 0,  saturationMult: 1.12, luminanceShift: -0.02 },
    { hueCenter: 30,  hueRange: 35, hueShift: 0,  saturationMult: 0.80, luminanceShift: 0.01 },
    { hueCenter: 120, hueRange: 40, hueShift: 0,  saturationMult: 0.82, luminanceShift: 0 },
  ],
  grain: NO_GRAIN,
  saturationBoost: 0.94,
  vibranceBoost: 1.06,
};

const VELVET_NIGHT: FilmPreset = {
  id: 'velvet-night',
  name: 'Velvet',
  category: 'Landscape',
  description: 'Dark, rich, mysterious. Deep purples and inky blacks, pinpoint light sources glow. Night landscape, stargazing.',
  useCase: 'Night landscapes, Milky Way, stargazing, dark forests at night, campfire',
  colorMatrix: [
    0.94, 0.01, 0.03, 0, -0.01,
    0.01, 0.94, 0.04, 0, -0.01,
    0.02, 0.03, 1.10, 0, 0.01,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.03,
      whitePoint: 0.94,
      shadowContrast: 0.55,
      highlightRolloff: 0.55,
      midtonePivot: 0.44,
    },
    red:   { blackPoint: 0.025, whitePoint: 0.93, shadowContrast: 0.54, highlightRolloff: 0.53, midtonePivot: 0.43 },
    green: { blackPoint: 0.030, whitePoint: 0.93, shadowContrast: 0.54, highlightRolloff: 0.54, midtonePivot: 0.44 },
    blue:  { blackPoint: 0.040, whitePoint: 0.95, shadowContrast: 0.52, highlightRolloff: 0.56, midtonePivot: 0.45 },
  },
  splitTone: {
    shadowHue: 255,
    shadowSaturation: 0.14,
    highlightHue: 240,
    highlightSaturation: 0.06,
    balance: -0.2,
  },
  hslAdjustments: [
    { hueCenter: 255, hueRange: 50, hueShift: 0,  saturationMult: 1.14, luminanceShift: -0.02 },
    { hueCenter: 210, hueRange: 45, hueShift: 10, saturationMult: 1.10, luminanceShift: -0.02 },
    { hueCenter: 30,  hueRange: 40, hueShift: 0,  saturationMult: 0.82, luminanceShift: 0.03 },
    { hueCenter: 0,   hueRange: 25, hueShift: 0,  saturationMult: 0.80, luminanceShift: 0.03 },
  ],
  grain: { intensity: 0.08, size: 1.4, luminanceResponse: 0.6 },
  saturationBoost: 0.92,
  vibranceBoost: 1.04,
};

// =============================================================================
// PORTRAIT — BATCH 2 (6 more presets → total 12)
// =============================================================================

const DARK_MOODY_PORTRAIT: FilmPreset = {
  id: 'dark-moody-portrait',
  name: 'Moody',
  category: 'Portrait',
  description: 'Low-key drama. Deep shadows, slightly lifted blacks, cool tones. Powerful and introspective.',
  useCase: 'Dramatic portraits, moody men\'s fashion, introspective, low-key studio, dark backgrounds',
  colorMatrix: [
    1.00, 0.01, 0.01, 0, -0.015,
    0,    0.98, 0.01, 0, -0.015,
    0.01, 0.02, 1.04, 0, -0.01,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.05,
      whitePoint: 0.96,
      shadowContrast: 0.62,
      highlightRolloff: 0.50,
      midtonePivot: 0.44,
    },
    red:   { blackPoint: 0.045, whitePoint: 0.96, shadowContrast: 0.61, highlightRolloff: 0.50, midtonePivot: 0.44 },
    green: { blackPoint: 0.050, whitePoint: 0.95, shadowContrast: 0.62, highlightRolloff: 0.49, midtonePivot: 0.43 },
    blue:  { blackPoint: 0.060, whitePoint: 0.96, shadowContrast: 0.60, highlightRolloff: 0.51, midtonePivot: 0.44 },
  },
  splitTone: {
    shadowHue: 225,
    shadowSaturation: 0.10,
    highlightHue: 35,
    highlightSaturation: 0.04,
    balance: 0.1,
  },
  hslAdjustments: [
    { hueCenter: 15,  hueRange: 30, hueShift: 0,  saturationMult: 1.02, luminanceShift: 0.02 },
    { hueCenter: 35,  hueRange: 25, hueShift: -2, saturationMult: 0.98, luminanceShift: 0.01 },
    { hueCenter: 120, hueRange: 45, hueShift: 0,  saturationMult: 0.78, luminanceShift: -0.03 },
    { hueCenter: 210, hueRange: 45, hueShift: 0,  saturationMult: 0.82, luminanceShift: -0.02 },
  ],
  grain: { intensity: 0.04, size: 1.2, luminanceResponse: 0.5 },
  saturationBoost: 0.92,
  vibranceBoost: 1.02,
};

const AIRY_LIGHT: FilmPreset = {
  id: 'airy-light',
  name: 'Airy',
  category: 'Portrait',
  description: 'High-key, bright, airy. Whites are pure, shadows barely exist. Celebratory, fresh, optimistic.',
  useCase: 'Wedding, celebration, newborn, children, bright outdoor, white studio',
  colorMatrix: [
    1.01, 0.01, 0,    0, 0.018,
    0.01, 1.00, 0.01, 0, 0.015,
    0,    0.01, 0.98, 0, 0.020,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.08,
      whitePoint: 1.00,
      shadowContrast: 0.34,
      highlightRolloff: 0.72,
      midtonePivot: 0.56,
    },
    red:   { blackPoint: 0.085, whitePoint: 1.00, shadowContrast: 0.35, highlightRolloff: 0.70, midtonePivot: 0.57 },
    green: { blackPoint: 0.080, whitePoint: 1.00, shadowContrast: 0.34, highlightRolloff: 0.72, midtonePivot: 0.56 },
    blue:  { blackPoint: 0.075, whitePoint: 0.99, shadowContrast: 0.33, highlightRolloff: 0.71, midtonePivot: 0.55 },
  },
  splitTone: {
    shadowHue: 30,
    shadowSaturation: 0.04,
    highlightHue: 40,
    highlightSaturation: 0.03,
    balance: 0.2,
  },
  hslAdjustments: [
    { hueCenter: 15,  hueRange: 35, hueShift: 1,  saturationMult: 1.04, luminanceShift: 0.04 },
    { hueCenter: 35,  hueRange: 25, hueShift: -1, saturationMult: 1.02, luminanceShift: 0.03 },
    { hueCenter: 120, hueRange: 40, hueShift: 0,  saturationMult: 0.85, luminanceShift: 0.02 },
    { hueCenter: 210, hueRange: 40, hueShift: 0,  saturationMult: 0.80, luminanceShift: 0.02 },
  ],
  grain: NO_GRAIN,
  saturationBoost: 0.94,
  vibranceBoost: 1.02,
};

const EARTH_TONE_PORTRAIT: FilmPreset = {
  id: 'earth-tone-portrait',
  name: 'Earth',
  category: 'Portrait',
  description: 'Warm, grounded, natural. Earthy palette with gentle desaturation. Works across all skin tones in outdoor light.',
  useCase: 'Outdoor natural light, environmental portraits, documentary, lifestyle, autumn sessions',
  colorMatrix: [
    1.04, 0.02, 0,    0, 0.008,
    0.01, 1.01, 0.01, 0, 0.005,
    0,    0.01, 0.95, 0, 0.010,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.04,
      whitePoint: 0.97,
      shadowContrast: 0.50,
      highlightRolloff: 0.60,
      midtonePivot: 0.50,
    },
    red:   { blackPoint: 0.045, whitePoint: 0.97, shadowContrast: 0.51, highlightRolloff: 0.60, midtonePivot: 0.51 },
    green: { blackPoint: 0.040, whitePoint: 0.97, shadowContrast: 0.50, highlightRolloff: 0.60, midtonePivot: 0.50 },
    blue:  { blackPoint: 0.035, whitePoint: 0.96, shadowContrast: 0.51, highlightRolloff: 0.58, midtonePivot: 0.49 },
  },
  splitTone: {
    shadowHue: 25,
    shadowSaturation: 0.07,
    highlightHue: 38,
    highlightSaturation: 0.05,
    balance: 0.0,
  },
  hslAdjustments: [
    { hueCenter: 15,  hueRange: 35, hueShift: 2,  saturationMult: 1.04, luminanceShift: 0.02 },
    { hueCenter: 35,  hueRange: 25, hueShift: -2, saturationMult: 1.02, luminanceShift: 0.01 },
    { hueCenter: 60,  hueRange: 30, hueShift: -5, saturationMult: 0.90, luminanceShift: 0 },
    { hueCenter: 120, hueRange: 45, hueShift: -5, saturationMult: 0.84, luminanceShift: 0 },
    { hueCenter: 210, hueRange: 45, hueShift: 0,  saturationMult: 0.80, luminanceShift: 0 },
  ],
  grain: { intensity: 0.02, size: 0.9, luminanceResponse: 0.4 },
  saturationBoost: 0.93,
  vibranceBoost: 1.02,
};

const SILVER_SHADOW: FilmPreset = {
  id: 'silver-shadow',
  name: 'Shadow',
  category: 'Portrait',
  description: 'Cool steel tones, silver highlights, precise tonal separation. Modern commercial and fashion.',
  useCase: 'Commercial, tech brands, corporate headshots, modern fashion, grey seamless',
  colorMatrix: [
    0.99, 0.01, 0.01, 0, -0.008,
    0.01, 0.99, 0.01, 0, -0.008,
    0.01, 0.02, 1.03, 0, 0.000,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.04,
      whitePoint: 0.97,
      shadowContrast: 0.56,
      highlightRolloff: 0.52,
      midtonePivot: 0.48,
    },
    red:   { blackPoint: 0.04, whitePoint: 0.96, shadowContrast: 0.55, highlightRolloff: 0.51, midtonePivot: 0.47 },
    green: { blackPoint: 0.04, whitePoint: 0.97, shadowContrast: 0.56, highlightRolloff: 0.52, midtonePivot: 0.48 },
    blue:  { blackPoint: 0.04, whitePoint: 0.97, shadowContrast: 0.55, highlightRolloff: 0.53, midtonePivot: 0.48 },
  },
  splitTone: {
    shadowHue: 215,
    shadowSaturation: 0.08,
    highlightHue: 205,
    highlightSaturation: 0.03,
    balance: 0.05,
  },
  hslAdjustments: [
    { hueCenter: 15,  hueRange: 30, hueShift: 0, saturationMult: 0.98, luminanceShift: 0.02 },
    { hueCenter: 210, hueRange: 50, hueShift: 5, saturationMult: 1.06, luminanceShift: -0.01 },
    { hueCenter: 120, hueRange: 40, hueShift: 0, saturationMult: 0.80, luminanceShift: 0 },
    { hueCenter: 30,  hueRange: 30, hueShift: 0, saturationMult: 0.82, luminanceShift: 0 },
  ],
  grain: NO_GRAIN,
  saturationBoost: 0.88,
  vibranceBoost: 1.02,
};

const VINTAGE_FADE: FilmPreset = {
  id: 'vintage-fade',
  name: 'Vintage',
  category: 'Portrait',
  description: 'Faded warm film nostalgia. Lifted shadows, slight yellow-orange cast, muted blues. Instagram-era photography.',
  useCase: 'Vintage-inspired, nostalgic, casual portraits, street, lifestyle, film-inspired',
  colorMatrix: [
    1.04, 0.02, 0,    0, 0.025,
    0.01, 1.01, 0.01, 0, 0.020,
    0,    0.01, 0.94, 0, 0.030,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.10,
      whitePoint: 0.96,
      shadowContrast: 0.40,
      highlightRolloff: 0.65,
      midtonePivot: 0.52,
    },
    red:   { blackPoint: 0.105, whitePoint: 0.96, shadowContrast: 0.42, highlightRolloff: 0.64, midtonePivot: 0.53 },
    green: { blackPoint: 0.100, whitePoint: 0.96, shadowContrast: 0.40, highlightRolloff: 0.65, midtonePivot: 0.52 },
    blue:  { blackPoint: 0.095, whitePoint: 0.95, shadowContrast: 0.39, highlightRolloff: 0.63, midtonePivot: 0.51 },
  },
  splitTone: {
    shadowHue: 35,
    shadowSaturation: 0.10,
    highlightHue: 48,
    highlightSaturation: 0.06,
    balance: 0.05,
  },
  hslAdjustments: [
    { hueCenter: 15,  hueRange: 35, hueShift: 3,  saturationMult: 1.04, luminanceShift: 0.02 },
    { hueCenter: 60,  hueRange: 30, hueShift: -5, saturationMult: 0.92, luminanceShift: 0.01 },
    { hueCenter: 210, hueRange: 50, hueShift: 0,  saturationMult: 0.78, luminanceShift: 0 },
    { hueCenter: 120, hueRange: 40, hueShift: 0,  saturationMult: 0.82, luminanceShift: 0 },
  ],
  grain: { intensity: 0.05, size: 1.1, luminanceResponse: 0.6 },
  saturationBoost: 0.90,
  vibranceBoost: 1.02,
};

const STREET_PORTRAIT: FilmPreset = {
  id: 'street-portrait',
  name: 'Street',
  category: 'Portrait',
  description: 'Documentary grit. Slightly desaturated, punchy midtone contrast, authentic. Reportage and environmental.',
  useCase: 'Street portraits, documentary, reportage, travel, candid, environmental',
  colorMatrix: [
    1.01, 0.01, 0,    0, -0.005,
    0,    1.00, 0.01, 0, -0.005,
    0,    0.01, 1.01, 0, 0.000,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.03,
      whitePoint: 0.97,
      shadowContrast: 0.60,
      highlightRolloff: 0.50,
      midtonePivot: 0.47,
    },
    red:   { blackPoint: 0.03, whitePoint: 0.97, shadowContrast: 0.59, highlightRolloff: 0.49, midtonePivot: 0.47 },
    green: { blackPoint: 0.03, whitePoint: 0.97, shadowContrast: 0.60, highlightRolloff: 0.50, midtonePivot: 0.47 },
    blue:  { blackPoint: 0.03, whitePoint: 0.97, shadowContrast: 0.58, highlightRolloff: 0.51, midtonePivot: 0.47 },
  },
  splitTone: {
    shadowHue: 220,
    shadowSaturation: 0.04,
    highlightHue: 30,
    highlightSaturation: 0.02,
    balance: 0,
  },
  hslAdjustments: [
    { hueCenter: 15,  hueRange: 35, hueShift: 0, saturationMult: 1.02, luminanceShift: 0.01 },
    { hueCenter: 120, hueRange: 45, hueShift: 0, saturationMult: 0.80, luminanceShift: -0.01 },
    { hueCenter: 210, hueRange: 50, hueShift: 0, saturationMult: 0.82, luminanceShift: -0.01 },
    { hueCenter: 60,  hueRange: 30, hueShift: 0, saturationMult: 0.84, luminanceShift: 0 },
  ],
  grain: { intensity: 0.06, size: 1.3, luminanceResponse: 0.55 },
  saturationBoost: 0.86,
  vibranceBoost: 1.0,
};

// =============================================================================
// MINIMALIST (3 presets — new category)
// =============================================================================

const PURE_LIGHT: FilmPreset = {
  id: 'pure-light',
  name: 'Pure',
  category: 'Minimalist',
  description: 'Extreme minimalism. Almost invisible grading — just tonal polish. Clean whites, gentle shadow lift, nothing more.',
  useCase: 'Architecture, product, fine art, any minimalist composition',
  colorMatrix: [
    1.0, 0, 0, 0, 0.005,
    0, 1.0, 0, 0, 0.005,
    0, 0, 1.0, 0, 0.005,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.03,
      whitePoint: 1.0,
      shadowContrast: 0.48,
      highlightRolloff: 0.58,
      midtonePivot: 0.50,
    },
    red: {
      blackPoint: 0.03,
      whitePoint: 1.0,
      shadowContrast: 0.48,
      highlightRolloff: 0.58,
      midtonePivot: 0.50,
    },
    green: {
      blackPoint: 0.03,
      whitePoint: 1.0,
      shadowContrast: 0.48,
      highlightRolloff: 0.58,
      midtonePivot: 0.50,
    },
    blue: {
      blackPoint: 0.03,
      whitePoint: 1.0,
      shadowContrast: 0.48,
      highlightRolloff: 0.58,
      midtonePivot: 0.50,
    },
  },
  splitTone: IDENTITY_SPLIT_TONE,
  hslAdjustments: [],
  grain: NO_GRAIN,
  saturationBoost: 0.98,
  vibranceBoost: 1.0,
};

const QUIET_CONTRAST: FilmPreset = {
  id: 'quiet-contrast',
  name: 'Quiet',
  category: 'Minimalist',
  description: 'High contrast meets desaturation. Dramatic tonal separation with muted, almost monochrome colors. Powerful and restrained.',
  useCase: 'Minimalist art, architecture, street, conceptual, any subject with strong shapes',
  colorMatrix: [
    1.0, 0, 0, 0, -0.02,
    0, 1.0, 0, 0, -0.02,
    0, 0, 1.0, 0, -0.01,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.02,
      whitePoint: 0.98,
      shadowContrast: 0.68,
      highlightRolloff: 0.42,
      midtonePivot: 0.46,
    },
    red: {
      blackPoint: 0.02,
      whitePoint: 0.98,
      shadowContrast: 0.67,
      highlightRolloff: 0.43,
      midtonePivot: 0.46,
    },
    green: {
      blackPoint: 0.02,
      whitePoint: 0.98,
      shadowContrast: 0.68,
      highlightRolloff: 0.42,
      midtonePivot: 0.46,
    },
    blue: {
      blackPoint: 0.025,
      whitePoint: 0.97,
      shadowContrast: 0.66,
      highlightRolloff: 0.44,
      midtonePivot: 0.46,
    },
  },
  splitTone: {
    shadowHue: 220,
    shadowSaturation: 0.04,
    highlightHue: 40,
    highlightSaturation: 0.02,
    balance: 0,
  },
  hslAdjustments: [
    { hueCenter: 0, hueRange: 180, hueShift: 0, saturationMult: 0.70, luminanceShift: 0 },
  ],
  grain: {
    intensity: 0.03,
    size: 1.0,
    luminanceResponse: 0.4,
  },
  saturationBoost: 0.72,
  vibranceBoost: 0.90,
};

const SUBTLE_TONE: FilmPreset = {
  id: 'subtle-tone',
  name: 'Subtle',
  category: 'Minimalist',
  description: 'Barely-there warm polish. The "invisible edit" — images look professionally finished without obvious grading.',
  useCase: 'Real estate, product, wedding delivery, any subject needing polish without personality',
  colorMatrix: [
    1.01, 0.005, 0, 0, 0.005,
    0.005, 1.005, 0.005, 0, 0.003,
    0, 0.005, 0.99, 0, 0.008,
    0, 0, 0, 1, 0,
  ],
  toneCurves: {
    master: {
      blackPoint: 0.02,
      whitePoint: 0.99,
      shadowContrast: 0.52,
      highlightRolloff: 0.56,
      midtonePivot: 0.50,
    },
    red: {
      blackPoint: 0.02,
      whitePoint: 0.99,
      shadowContrast: 0.52,
      highlightRolloff: 0.56,
      midtonePivot: 0.50,
    },
    green: {
      blackPoint: 0.02,
      whitePoint: 0.99,
      shadowContrast: 0.52,
      highlightRolloff: 0.56,
      midtonePivot: 0.50,
    },
    blue: {
      blackPoint: 0.02,
      whitePoint: 0.99,
      shadowContrast: 0.51,
      highlightRolloff: 0.55,
      midtonePivot: 0.50,
    },
  },
  splitTone: {
    shadowHue: 30,
    shadowSaturation: 0.03,
    highlightHue: 40,
    highlightSaturation: 0.02,
    balance: 0,
  },
  hslAdjustments: [
    { hueCenter: 15, hueRange: 35, hueShift: 0, saturationMult: 1.03, luminanceShift: 0.01 },
  ],
  grain: NO_GRAIN,
  saturationBoost: 1.0,
  vibranceBoost: 1.02,
};

// =============================================================================
// FULL PRESET LIBRARY
// =============================================================================

export const PRESET_LIBRARY: FilmPreset[] = [
  // Film Emulation
  PORTRA_400,
  VELVIA_50,
  CINESTILL_800T,
  EKTAR_100,
  // Landscape (16)
  GOLDEN_HOUR,
  MISTY_DAWN,
  DRAMATIC_STORM,
  ALPINE_CLARITY,
  DESERT_GLOW,
  NORDIC_BLUE,
  DEEP_FOREST,
  COASTAL_DRAMA,
  BLUE_HOUR,
  SUNRISE_CRIMSON,
  OVERCAST_MOOD,
  WINTER_WHITE,
  MONSOON_GREEN,
  CANYON_RED,
  OCEAN_HORIZON,
  VELVET_NIGHT,
  // Portrait (12)
  SOFT_SKIN,
  EDITORIAL,
  CLEAN_MINIMAL,
  STUDIO_POWER,
  WARM_GLOW,
  BACKLIT_PORTRAIT,
  DARK_MOODY_PORTRAIT,
  AIRY_LIGHT,
  EARTH_TONE_PORTRAIT,
  SILVER_SHADOW,
  VINTAGE_FADE,
  STREET_PORTRAIT,
  // Moody & Cinematic
  TEAL_ORANGE,
  FADED_NOIR,
  // Black & White
  TRI_X_400,
  SILVER_GELATIN,
  ZONE_SYSTEM,
  DECISIVE_MOMENT,
  BIBLICAL_SHADOW,
  ARBUS_FLAT,
  PLATINUM_GRADIENT,
  GRAPHIC_FASHION,
  // Minimalist (3 — new category)
  PURE_LIGHT,
  QUIET_CONTRAST,
  SUBTLE_TONE,
  // Creative
  AUTUMN_PALETTE,
  CROSS_PROCESS,
];

export const PRESET_CATEGORIES: PresetCategory[] = [
  'Film Emulation',
  'Landscape',
  'Portrait',
  'Moody & Cinematic',
  'Black & White',
  'Minimalist',
  'Creative',
];

/** Get a preset by ID */
export function getPresetById(id: string): FilmPreset | undefined {
  return PRESET_LIBRARY.find((p) => p.id === id);
}

/** Get all presets in a category */
export function getPresetsByCategory(category: PresetCategory): FilmPreset[] {
  return PRESET_LIBRARY.filter((p) => p.category === category);
}
