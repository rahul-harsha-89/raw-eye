import React, { useMemo, useRef, useImperativeHandle, forwardRef } from 'react';
import {
  Canvas,
  Image,
  useImage,
  ColorMatrix,
  RuntimeShader,
  Group,
  rect,
  type SkImage,
} from '@shopify/react-native-skia';
import { useWindowDimensions } from 'react-native';
import type { EditRecipe } from './EditRecipe';
import { buildColorMatrix, vignetteShader, sharpenShader } from './shaders/adjustments';
import { zonalAdjustShader } from './shaders/zonalAdjust';
import { noiseReductionShader } from './shaders/noiseReduction';
import {
  createFilmEffect,
  createSimplePresetEffect,
  createGrainEffect,
  getPresetById,
  buildFilmUniforms,
  buildSimplePresetUniforms,
  buildGrainUniforms,
} from './presets';
import { BUNDLED_STYLES, styleProfileToColorMatrix } from './StyleTransfer';

interface RenderPipelineProps {
  imageUri: string;
  recipe: EditRecipe;
  width?: number;
  height?: number;
}

export interface RenderPipelineRef {
  makeSnapshot: () => SkImage | null;
}

// Create shader effects once (compiled on GPU at startup)
// Try complex first, fall back to simple
const filmEffect = createFilmEffect();
const simplePresetEffect = filmEffect ? null : createSimplePresetEffect();
const grainEffect = createGrainEffect();

// Log which preset pipeline is active
if (filmEffect) {
  console.log('[Pipeline] Using FULL film shader pipeline');
} else if (simplePresetEffect) {
  console.log('[Pipeline] Using SIMPLE preset shader pipeline (fallback)');
} else {
  console.log('[Pipeline] Using COLOR MATRIX ONLY pipeline (both shaders failed)');
}

// Identity matrix for comparison
const IDENTITY_MATRIX = [1,0,0,0,0, 0,1,0,0,0, 0,0,1,0,0, 0,0,0,1,0];

function isIdentity(matrix: number[]): boolean {
  return matrix.every((v, i) => Math.abs(v - IDENTITY_MATRIX[i]) < 0.0001);
}

/**
 * Build a standalone color matrix for a preset that incorporates saturation/vibrance.
 * Used when NO shader is available (matrix-only fallback).
 * Bakes saturation into the matrix and moderates aggressive channel values.
 */
function buildStandalonePresetMatrix(preset: ReturnType<typeof getPresetById>, intensity: number): number[] {
  if (!preset) return IDENTITY_MATRIX;

  const t = intensity / 100;
  const base = preset.colorMatrix;

  // Bake in saturation boost via luminance-weighted desaturation matrix
  const sat = preset.saturationBoost;
  const lr = 0.2126, lg = 0.7152, lb = 0.0722;
  const sr = (1 - sat) * lr, sg = (1 - sat) * lg, sb = (1 - sat) * lb;
  const satMatrix = [
    sr + sat, sg, sb, 0, 0,
    sr, sg + sat, sb, 0, 0,
    sr, sg, sb + sat, 0, 0,
    0, 0, 0, 1, 0,
  ];

  // Multiply base × saturation matrix
  const combined = multiplyMatrices(base, satMatrix);

  // Bake in black point lift as an offset
  const bp = preset.toneCurves.master.blackPoint;
  if (bp > 0.01) {
    combined[4] += bp * 0.8;   // R offset
    combined[9] += bp * 0.8;   // G offset
    combined[14] += bp * 0.8;  // B offset
  }

  // Interpolate with identity at the given intensity
  return combined.map((v, i) => IDENTITY_MATRIX[i] + (v - IDENTITY_MATRIX[i]) * t);
}

function multiplyMatrices(a: number[], b: number[]): number[] {
  const result = new Array(20).fill(0);
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 5; col++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) {
        sum += a[row * 5 + k] * b[k * 5 + col];
      }
      if (col === 4) sum += a[row * 5 + 4];
      result[row * 5 + col] = sum;
    }
  }
  return result;
}

const RenderPipeline = forwardRef<RenderPipelineRef, RenderPipelineProps>(({
  imageUri,
  recipe,
  width: containerWidth,
  height: containerHeight,
}, ref) => {
  const { width: screenWidth } = useWindowDimensions();
  const image = useImage(imageUri);
  const canvasRef = useRef<any>(null);

  const canvasWidth = containerWidth ?? screenWidth;
  const canvasHeight = containerHeight ?? screenWidth;

  const imageRect = useMemo(() => {
    if (!image) return { x: 0, y: 0, width: canvasWidth, height: canvasHeight };
    const imgW = image.width();
    const imgH = image.height();
    const scale = Math.min(canvasWidth / imgW, canvasHeight / imgH);
    const w = imgW * scale;
    const h = imgH * scale;
    return {
      x: (canvasWidth - w) / 2,
      y: (canvasHeight - h) / 2,
      width: w,
      height: h,
    };
  }, [image, canvasWidth, canvasHeight]);

  // If a crop rect is set (normalised 0–1 relative to source image),
  // compute its canvas-space bounds for snapshot and visual clip.
  const cropCanvasRect = useMemo(() => {
    const cr = recipe.geometry.cropRect;
    if (!cr) return null;
    return {
      x: Math.round(imageRect.x + cr.x * imageRect.width),
      y: Math.round(imageRect.y + cr.y * imageRect.height),
      width: Math.round(cr.width * imageRect.width),
      height: Math.round(cr.height * imageRect.height),
    };
  }, [recipe.geometry.cropRect, imageRect]);

  useImperativeHandle(ref, () => ({
    makeSnapshot: () => {
      if (!canvasRef.current) return null;
      // Use crop bounds if active, otherwise full image bounds (no letterbox)
      const bounds = cropCanvasRect ?? {
        x: Math.round(imageRect.x),
        y: Math.round(imageRect.y),
        width: Math.round(imageRect.width),
        height: Math.round(imageRect.height),
      };
      return canvasRef.current.makeImageSnapshot(bounds);
    },
  }), [imageRect, cropCanvasRect]);

  // Manual adjustment color matrix
  const colorMatrix = useMemo(() => buildColorMatrix(recipe), [recipe]);
  const colorMatrixIsIdentity = useMemo(() => isIdentity(colorMatrix), [colorMatrix]);

  // ─── Preset handling: film shader → simple shader → matrix ───

  const preset = useMemo(() => {
    if (!recipe.preset?.lutId) return null;
    return getPresetById(recipe.preset.lutId) ?? null;
  }, [recipe.preset?.lutId]);

  // Preset color matrix (Layer 7) — always computed; raw matrix only when shader available
  const presetColorMatrix = useMemo(() => {
    if (!preset || !recipe.preset) return null;
    const t = recipe.preset.intensity / 100;

    if (filmEffect || simplePresetEffect) {
      // Shader handles saturation/tone — use raw channel matrix only
      return preset.colorMatrix.map((v, i) => IDENTITY_MATRIX[i] + (v - IDENTITY_MATRIX[i]) * t);
    } else {
      // No shader: bake saturation + tone into the matrix
      return buildStandalonePresetMatrix(preset, recipe.preset.intensity);
    }
  }, [preset, recipe.preset]);

  // Complex film shader uniforms (Layer 8)
  const filmUniforms = useMemo(() => {
    if (!preset || !recipe.preset || !filmEffect) return null;
    return buildFilmUniforms(preset, recipe.preset.intensity);
  }, [preset, recipe.preset]);

  // Simple preset shader uniforms (Layer 8 fallback)
  const simpleUniforms = useMemo(() => {
    if (!preset || !recipe.preset || !simplePresetEffect || filmEffect) return null;
    return buildSimplePresetUniforms(preset, recipe.preset.intensity);
  }, [preset, recipe.preset]);

  // Grain uniforms
  const grainUniforms = useMemo(() => {
    if (!preset || !recipe.preset || !grainEffect) return null;
    if (preset.grain.intensity === 0) return null;
    return buildGrainUniforms(preset, recipe.preset.intensity);
  }, [preset, recipe.preset]);

  // AI Style color matrix
  const aiStyleMatrix = useMemo(() => {
    if (!recipe.aiStyle?.modelId) return null;
    const style = BUNDLED_STYLES.find((s) => s.id === recipe.aiStyle!.modelId);
    if (!style) return null;
    return styleProfileToColorMatrix(style.profile, recipe.aiStyle.intensity);
  }, [recipe.aiStyle]);

  // Resolution for shaders
  const res = useMemo(
    () => [imageRect.width, imageRect.height] as [number, number],
    [imageRect.width, imageRect.height],
  );

  // Determine which layers are active
  const needsColorMatrix = !colorMatrixIsIdentity;
  const needsZonal = (recipe.light.highlights !== 0 || recipe.light.shadows !== 0 ||
                      recipe.light.whites !== 0 || recipe.light.blacks !== 0) && !!zonalAdjustShader;
  const needsNR = (recipe.detail.nrLuminance > 0 || recipe.detail.nrColor > 0) && !!noiseReductionShader;
  const needsSharpness = recipe.detail.sharpness > 0 && !!sharpenShader;
  const needsVignette = recipe.optics.vignette !== 0 && !!vignetteShader;
  const needsAIStyle = aiStyleMatrix !== null && !isIdentity(aiStyleMatrix);
  const needsPresetMatrix = presetColorMatrix !== null && !isIdentity(presetColorMatrix);
  const needsFilmShader = filmUniforms !== null && filmEffect !== null;
  const needsSimplePreset = simpleUniforms !== null && simplePresetEffect !== null && !filmEffect;
  const needsGrain = grainUniforms !== null && grainEffect !== null;
  const needsRotation = recipe.geometry.rotation !== 0;

  if (!image) return null;

  // Build render tree from inside out.
  // Each active filter wraps its content in a Group for proper sequential processing.

  let renderTree: React.ReactNode = (
    <Image
      image={image}
      x={imageRect.x}
      y={imageRect.y}
      width={imageRect.width}
      height={imageRect.height}
      fit="contain"
    />
  );

  // Layer 0: Rotation (closest to image)
  if (needsRotation) {
    const radians = recipe.geometry.rotation * Math.PI / 180;
    const cx = imageRect.x + imageRect.width / 2;
    const cy = imageRect.y + imageRect.height / 2;
    renderTree = (
      <Group transform={[{ rotate: radians }]} origin={{ x: cx, y: cy }}>
        {renderTree}
      </Group>
    );
  }

  // Layer 1: Base color adjustments (exposure, contrast, temp, tint, sat, vibrance)
  if (needsColorMatrix) {
    renderTree = (
      <Group>
        <ColorMatrix matrix={colorMatrix} />
        {renderTree}
      </Group>
    );
  }

  // Layer 2: Zonal adjustments (highlights/shadows/whites/blacks)
  if (needsZonal) {
    renderTree = (
      <Group>
        <RuntimeShader
          source={zonalAdjustShader!}
          uniforms={{
            resolution: res,
            highlights: recipe.light.highlights / 100,
            shadows: recipe.light.shadows / 100,
            whites: recipe.light.whites / 100,
            blacks: recipe.light.blacks / 100,
          }}
        />
        {renderTree}
      </Group>
    );
  }

  // Layer 3: Noise reduction
  if (needsNR) {
    renderTree = (
      <Group>
        <RuntimeShader
          source={noiseReductionShader!}
          uniforms={{
            resolution: res,
            nrLuminance: recipe.detail.nrLuminance / 100,
            nrColor: recipe.detail.nrColor / 100,
          }}
        />
        {renderTree}
      </Group>
    );
  }

  // Layer 4: Sharpness
  if (needsSharpness) {
    renderTree = (
      <Group>
        <RuntimeShader
          source={sharpenShader!}
          uniforms={{ resolution: res, amount: recipe.detail.sharpness }}
        />
        {renderTree}
      </Group>
    );
  }

  // Layer 5: Vignette
  if (needsVignette) {
    renderTree = (
      <Group>
        <RuntimeShader
          source={vignetteShader!}
          uniforms={{ resolution: res, intensity: recipe.optics.vignette }}
        />
        {renderTree}
      </Group>
    );
  }

  // Layer 6: AI Style color transform
  if (needsAIStyle) {
    renderTree = (
      <Group>
        <ColorMatrix matrix={aiStyleMatrix!} />
        {renderTree}
      </Group>
    );
  }

  // Layer 7: Preset color matrix
  if (needsPresetMatrix) {
    renderTree = (
      <Group>
        <ColorMatrix matrix={presetColorMatrix!} />
        {renderTree}
      </Group>
    );
  }

  // Layer 8: Film preset shader — FULL (tone curves + split tone + HSL + sat/vib)
  if (needsFilmShader) {
    renderTree = (
      <Group>
        <RuntimeShader
          source={filmEffect!}
          uniforms={{ resolution: res, ...filmUniforms }}
        />
        {renderTree}
      </Group>
    );
  }

  // Layer 8 alt: Simple preset shader — fallback when film shader unavailable
  if (needsSimplePreset) {
    renderTree = (
      <Group>
        <RuntimeShader
          source={simplePresetEffect!}
          uniforms={{ resolution: res, ...simpleUniforms }}
        />
        {renderTree}
      </Group>
    );
  }

  // Layer 9: Film grain
  if (needsGrain) {
    renderTree = (
      <Group>
        <RuntimeShader
          source={grainEffect!}
          uniforms={{ resolution: res, ...grainUniforms }}
        />
        {renderTree}
      </Group>
    );
  }

  // Layer 10: Crop clip (outermost — applied after all effects)
  if (cropCanvasRect) {
    renderTree = (
      <Group clip={rect(cropCanvasRect.x, cropCanvasRect.y, cropCanvasRect.width, cropCanvasRect.height)}>
        {renderTree}
      </Group>
    );
  }

  return (
    <Canvas ref={canvasRef} style={{ width: canvasWidth, height: canvasHeight }}>
      {renderTree}
    </Canvas>
  );
});

RenderPipeline.displayName = 'RenderPipeline';
export default RenderPipeline;
