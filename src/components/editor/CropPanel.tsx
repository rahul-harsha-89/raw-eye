import { View, Pressable, StyleSheet, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../../theme';
import Text from '../Text';
import PrecisionSlider from './PrecisionSlider';
import { useEditorStore } from '../../store/editorStore';

// Aspect ratio definitions.
// ratio = width / height. null = free (preserve current or full image).
const ASPECT_RATIOS = [
  { label: 'Free',  ratio: null  },
  { label: '1:1',   ratio: 1     },
  { label: '4:3',   ratio: 4/3   },
  { label: '3:2',   ratio: 3/2   },
  { label: '16:9',  ratio: 16/9  },
  { label: '9:16',  ratio: 9/16  },
] as const;

/** Build a centred normalised crop rect for the given aspect ratio.
 *  Coordinates are 0–1 relative to source image dimensions.
 *  Fits inside the image without exceeding its bounds.
 */
function buildCropRect(
  imageWidth: number,
  imageHeight: number,
  targetRatio: number,
): { x: number; y: number; width: number; height: number } {
  const imageRatio = imageWidth / imageHeight;
  let w: number, h: number;
  if (targetRatio > imageRatio) {
    // Crop is wider than image — constrained by width
    w = 1.0;
    h = imageRatio / targetRatio;
  } else {
    // Crop is taller than image — constrained by height
    h = 1.0;
    w = targetRatio / imageRatio;
  }
  return {
    x: (1 - w) / 2,
    y: (1 - h) / 2,
    width: w,
    height: h,
  };
}

interface CropPanelProps {
  rotationValue: number;
  onRotationChange: (v: number) => void;
  onSlidingStart?: () => void;
}

export default function CropPanel({ rotationValue, onRotationChange, onSlidingStart }: CropPanelProps) {
  const {
    recipe,
    imageWidth,
    imageHeight,
    updateGeometry,
    pushUndo,
  } = useEditorStore();

  const crop = recipe.geometry.cropRect;

  const handleAspectRatio = (ratio: number | null) => {
    pushUndo();
    if (ratio === null) {
      // Free — remove crop constraint (full image)
      updateGeometry('cropRect', null);
    } else {
      if (imageWidth <= 0 || imageHeight <= 0) {
        updateGeometry('cropRect', null);
        return;
      }
      const rect = buildCropRect(imageWidth, imageHeight, ratio);
      updateGeometry('cropRect', rect);
    }
    Haptics.selectionAsync();
  };

  const handleReset = () => {
    pushUndo();
    updateGeometry('cropRect', null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Determine which chip is active
  const getActiveRatio = (): number | null => {
    if (!crop) return null;
    if (imageWidth <= 0 || imageHeight <= 0) return null;
    const imageRatio = imageWidth / imageHeight;
    const cropRatio = (crop.width * imageWidth) / (crop.height * imageHeight);
    // Allow small rounding tolerance
    for (const { ratio } of ASPECT_RATIOS) {
      if (ratio === null) continue;
      if (Math.abs(cropRatio - ratio) < 0.02) return ratio;
    }
    return null; // custom / free crop
  };
  const activeRatio = getActiveRatio();

  // Human-readable current crop dimensions in pixels
  const cropPixelW = crop && imageWidth > 0 ? Math.round(crop.width * imageWidth) : imageWidth;
  const cropPixelH = crop && imageHeight > 0 ? Math.round(crop.height * imageHeight) : imageHeight;
  const hasCrop = crop !== null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Section header */}
      <Text variant="labelCaps" color="onSurfaceVariant">ASPECT RATIO</Text>

      {/* Aspect ratio chips */}
      <View style={styles.chipRow}>
        {ASPECT_RATIOS.map(({ label, ratio }) => {
          const isActive = ratio === null
            ? !hasCrop
            : Math.abs((activeRatio ?? -1) - ratio) < 0.02;
          return (
            <Pressable
              key={label}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => handleAspectRatio(ratio)}
            >
              <Text
                variant="labelSm"
                color={isActive ? 'primary' : 'onSurfaceVariant'}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Current crop info */}
      <View style={styles.infoRow}>
        <Text variant="monoData" color="onSurface">
          {cropPixelW} × {cropPixelH} px
        </Text>
        {imageWidth > 0 && (
          <Text variant="monoData" color="onSurfaceVariant">
            {((cropPixelW * cropPixelH) / 1_000_000).toFixed(1)} MP
          </Text>
        )}
      </View>

      {/* Reset button — only visible when a crop is active */}
      {hasCrop && (
        <Pressable style={styles.resetRow} onPress={handleReset}>
          <MaterialIcons name="crop-free" size={18} color={colors.error} />
          <Text variant="labelSm" color="error">Reset Crop</Text>
        </Pressable>
      )}

      {/* Rotation / Straighten */}
      <Text variant="labelCaps" color="onSurfaceVariant">STRAIGHTEN</Text>
      <PrecisionSlider
        label="Rotation"
        value={rotationValue}
        min={-45}
        max={45}
        step={0.1}
        bipolar
        defaultValue={0}
        formatValue={(v) => `${v.toFixed(1)}°`}
        onValueChange={onRotationChange}
        onSlidingStart={onSlidingStart}
      />

      {/* Hint */}
      <Text variant="monoData" color="onSurfaceVariant" style={styles.hint}>
        Crop is applied to preview, snapshot and full-res export.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.edgeMargin,
    paddingVertical: spacing.gutter,
    gap: spacing.gutter * 2,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.unit * 2,
  },
  chip: {
    paddingHorizontal: 16,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainerHigh,
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.gutter,
    alignItems: 'center',
  },
  resetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit * 2,
    paddingVertical: spacing.unit * 2,
  },
  hint: {
    lineHeight: 16,
    opacity: 0.7,
  },
});
