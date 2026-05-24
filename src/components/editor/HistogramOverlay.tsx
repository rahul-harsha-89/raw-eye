import { StyleSheet, useWindowDimensions, View, Pressable } from 'react-native';
import { useMemo } from 'react';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { colors, spacing } from '../../theme';
import Text from '../Text';
import { MaterialIcons } from '@expo/vector-icons';
import { useEditorStore } from '../../store/editorStore';
import type { EditRecipe } from '../../engine/EditRecipe';
import { getPresetById } from '../../engine/presets';

// ─── Histogram config ───
const BINS = 48;
const HISTOGRAM_WIDTH = 168;
const HISTOGRAM_HEIGHT = 44;

// ─── Simulate RGB histogram from recipe + active preset ───
function generateBins(recipe: EditRecipe): {
  r: number[];
  g: number[];
  b: number[];
} {
  const exposure    = recipe.light.exposure;     // –5 to +5
  const contrast    = recipe.light.contrast;     // –100 to 100
  const highlights  = recipe.light.highlights;  // –100 to 100
  const shadows     = recipe.light.shadows;     // –100 to 100
  const temperature = recipe.color.temperature; // –100 to 100

  // ── Preset tonal influence ──
  let presetExposureShift = 0;   // EV shift from black/white point
  let presetContrastBoost = 0;   // extra contrast units
  let presetTempBias      = 0;   // warm/cool shift from split tone
  let presetShadowLift    = 0;   // black point lift → shadow floor rises
  let presetHlCompress    = 0;   // white point pull → highlight ceiling drops

  if (recipe.preset?.lutId) {
    const preset = getPresetById(recipe.preset.lutId);
    if (preset) {
      const t = recipe.preset.intensity / 100;
      const mc = preset.toneCurves.master;

      // Black point lift shifts average brightness right
      presetShadowLift    = mc.blackPoint * t;
      // White point compression shifts upper range left
      presetHlCompress    = (1 - mc.whitePoint) * t;
      // Shadow contrast > 0.5 = more contrast, < 0.5 = less
      presetContrastBoost = (mc.shadowContrast - 0.5) * t * 120;
      // Exposure shift: lifted blacks + compressed highlights → slight brightness change
      presetExposureShift = (presetShadowLift - presetHlCompress) * 2;

      // Temperature bias from split-tone shadow hue
      // Warm hues (0–90° and 270–360°) shift red; cool hues (90–270°) shift blue
      const sh = preset.splitTone.shadowHue;
      const isWarm = sh < 90 || sh > 270;
      presetTempBias = (isWarm ? 1 : -1) * preset.splitTone.shadowSaturation * t * 30;
    }
  }
  // ────────────────────────────────

  // Effective values combining manual sliders + preset
  const effectiveContrast = contrast + presetContrastBoost;
  const effectiveTemp     = temperature + presetTempBias;

  // Center of the bell curve. Exposure + preset black-point both shift it.
  const center = Math.max(0.1, Math.min(0.9,
    0.5 + exposure / 14 + presetExposureShift + presetShadowLift * 0.4,
  ));
  // Spread: higher contrast → narrower bell.
  const spread = Math.max(0.04, 0.22 - effectiveContrast / 1100);

  const r: number[] = [];
  const g: number[] = [];
  const b: number[] = [];

  for (let i = 0; i < BINS; i++) {
    const x = (i + 0.5) / BINS;

    // Gaussian base
    const base = Math.exp(-Math.pow(x - center, 2) / (2 * spread * spread));

    // Highlight shoulder — compressed when preset clips highlights
    const hlPeak = Math.max(0.70, 0.88 - presetHlCompress * 0.4);
    const hlCurve = Math.exp(-Math.pow(x - hlPeak, 2) / 0.012);

    // Shadow toe — rises when preset lifts blacks
    const shPeak = Math.min(0.25, 0.12 + presetShadowLift * 0.3);
    const shCurve = Math.exp(-Math.pow(x - shPeak, 2) / 0.012);

    // Combine
    let v = base
      + (highlights / 100) * 0.45 * hlCurve
      - (shadows   / 100) * 0.35 * shCurve;
    v = Math.max(0, v);

    // Temperature (manual + preset split-tone): warm → more red, less blue
    const tFactor = effectiveTemp / 350;
    r.push(v * (1 + tFactor * 0.35));
    g.push(v * 0.93);
    b.push(v * (1 - tFactor * 0.35));
  }

  // Normalise to 0–1 so tallest bar = full height
  const peak = Math.max(...r, ...g, ...b, 0.001);
  return {
    r: r.map(v => Math.max(0, v / peak)),
    g: g.map(v => Math.max(0, v / peak)),
    b: b.map(v => Math.max(0, v / peak)),
  };
}

// ─── Single channel bar row ───
function BarRow({
  bins,
  color,
  height,
}: {
  bins: number[];
  color: string;
  height: number;
}) {
  const barW = HISTOGRAM_WIDTH / BINS;
  return (
    <View style={[StyleSheet.absoluteFillObject, { flexDirection: 'row', alignItems: 'flex-end' }]}>
      {bins.map((v, i) => (
        <View
          key={i}
          style={{
            width: barW,
            height: Math.max(1, v * height),
            backgroundColor: color,
          }}
        />
      ))}
    </View>
  );
}

// ─── Main component ───
interface HistogramOverlayProps {
  iso?: string;
  aperture?: string;
  shutterSpeed?: string;
  onClose?: () => void;
}

export default function HistogramOverlay({
  iso = '—',
  aperture = '—',
  shutterSpeed = '—',
  onClose,
}: HistogramOverlayProps) {
  const { width: screenW } = useWindowDimensions();

  // Subscribe to only the fields that affect histogram shape —
  // avoids re-running generateBins on every unrelated state change.
  const exposure    = useEditorStore((s) => s.recipe.light.exposure);
  const contrast    = useEditorStore((s) => s.recipe.light.contrast);
  const highlights  = useEditorStore((s) => s.recipe.light.highlights);
  const shadows     = useEditorStore((s) => s.recipe.light.shadows);
  const temperature = useEditorStore((s) => s.recipe.color.temperature);
  const presetLutId = useEditorStore((s) => s.recipe.preset?.lutId ?? null);
  const presetIntensity = useEditorStore((s) => s.recipe.preset?.intensity ?? 0);

  const bins = useMemo(() => {
    // Re-derive a minimal recipe snapshot for generateBins
    const recipe = useEditorStore.getState().recipe;
    return generateBins(recipe);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exposure, contrast, highlights, shadows, temperature, presetLutId, presetIntensity]);

  // ─── Drag position ───
  const posX = useSharedValue(spacing.edgeMargin);
  const posY = useSharedValue(spacing.edgeMargin);
  const startX = useSharedValue(spacing.edgeMargin);
  const startY = useSharedValue(spacing.edgeMargin);

  const maxX = screenW - HISTOGRAM_WIDTH - spacing.edgeMargin;

  const panGesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = posX.value;
      startY.value = posY.value;
    })
    .onUpdate((e) => {
      posX.value = Math.max(0, Math.min(startX.value + e.translationX, maxX));
      posY.value = Math.max(0, Math.min(startY.value + e.translationY, 320));
    });

  const animStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: posX.value },
      { translateY: posY.value },
    ],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, animStyle]}>
        {/* EXIF strip + close button */}
        <View style={styles.exifRow}>
          <Text variant="monoData" color="onSurface">ISO {iso}</Text>
          <Text variant="monoData" color="onSurface">f/{aperture}</Text>
          <Text variant="monoData" color="onSurface">{shutterSpeed}s</Text>
          {onClose && (
            <Pressable onPress={onClose} hitSlop={8} style={styles.closeBtn}>
              <MaterialIcons name="close" size={12} color="rgba(255,255,255,0.55)" />
            </Pressable>
          )}
        </View>

        {/* Histogram bars — stacked R/G/B with transparency */}
        <View style={styles.histogramArea}>
          {/* Background grid line */}
          <View style={styles.gridMidLine} />
          <BarRow bins={bins.b} color="rgba(100,150,255,0.55)" height={HISTOGRAM_HEIGHT} />
          <BarRow bins={bins.g} color="rgba(80,200,120,0.45)" height={HISTOGRAM_HEIGHT} />
          <BarRow bins={bins.r} color="rgba(255,90,90,0.50)"  height={HISTOGRAM_HEIGHT} />
        </View>

        {/* Drag hint */}
        <View style={styles.dragHandle}>
          <View style={styles.handleDot} />
          <View style={styles.handleDot} />
          <View style={styles.handleDot} />
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 20,
    width: HISTOGRAM_WIDTH,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 6,
    paddingTop: 6,
    paddingBottom: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    gap: 4,
  },
  exifRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 2,
  },
  histogramArea: {
    width: HISTOGRAM_WIDTH - 12,
    height: HISTOGRAM_HEIGHT,
    position: 'relative',
    overflow: 'hidden',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  gridMidLine: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  dragHandle: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 2,
  },
  handleDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  closeBtn: {
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
