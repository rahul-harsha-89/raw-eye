export interface LightParams {
  exposure: number;
  contrast: number;
  highlights: number;
  shadows: number;
  whites: number;
  blacks: number;
}

export interface ColorParams {
  temperature: number;
  tint: number;
  vibrance: number;
  saturation: number;
}

export interface DetailParams {
  sharpness: number;
  nrLuminance: number;
  nrColor: number;
  textureRecovery: number;
}

export interface OpticsParams {
  vignette: number;
  chromaticAberration: boolean;
}

export interface GeometryParams {
  cropRect: { x: number; y: number; width: number; height: number } | null;
  rotation: number;
}

export interface AIStyleParams {
  modelId: string;
  intensity: number;
}

export interface PresetParams {
  lutId: string;
  intensity: number;
}

export interface EditRecipe {
  light: LightParams;
  color: ColorParams;
  detail: DetailParams;
  optics: OpticsParams;
  geometry: GeometryParams;
  aiStyle: AIStyleParams | null;
  preset: PresetParams | null;
}

export const DEFAULT_LIGHT: LightParams = {
  exposure: 0,
  contrast: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
};

export const DEFAULT_COLOR: ColorParams = {
  temperature: 0,
  tint: 0,
  vibrance: 0,
  saturation: 0,
};

export const DEFAULT_DETAIL: DetailParams = {
  sharpness: 0,
  nrLuminance: 0,
  nrColor: 0,
  textureRecovery: 0,
};

export const DEFAULT_OPTICS: OpticsParams = {
  vignette: 0,
  chromaticAberration: false,
};

export const DEFAULT_GEOMETRY: GeometryParams = {
  cropRect: null,
  rotation: 0,
};

export const DEFAULT_RECIPE: EditRecipe = {
  light: { ...DEFAULT_LIGHT },
  color: { ...DEFAULT_COLOR },
  detail: { ...DEFAULT_DETAIL },
  optics: { ...DEFAULT_OPTICS },
  geometry: { ...DEFAULT_GEOMETRY },
  aiStyle: null,
  preset: null,
};

export function createDefaultRecipe(): EditRecipe {
  return JSON.parse(JSON.stringify(DEFAULT_RECIPE));
}
