import { useState } from 'react';
import { View, Pressable, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as FileSystem from 'expo-file-system/legacy';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RootStackParamList } from '../../navigation/RootNavigator';
import { colors, spacing } from '../../theme';
import { useEditorStore } from '../../store/editorStore';
import { useExportStore } from '../../store/exportStore';
import Text from '../Text';

interface ToolItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  description: string;
  onPress: () => void;
  active?: boolean;
  destructive?: boolean;
  loading?: boolean;
  disabled?: boolean;
}

function ToolItem({ icon, label, description, onPress, active, destructive, loading, disabled }: ToolItemProps) {
  return (
    <Pressable
      style={[styles.toolItem, active && styles.toolItemActive, disabled && styles.toolItemDisabled]}
      onPress={onPress}
      disabled={loading || disabled}
    >
      <View style={[styles.iconContainer, active && styles.iconContainerActive]}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <MaterialIcons
            name={icon}
            size={22}
            color={
              disabled   ? colors.outline :
              destructive ? colors.error  :
              active      ? colors.primary :
                            colors.onSurface
            }
          />
        )}
      </View>
      <View style={styles.toolText}>
        <Text
          variant="labelSm"
          color={disabled ? 'outline' : destructive ? 'error' : active ? 'primary' : 'onSurface'}
        >
          {label}
        </Text>
        <Text variant="monoData" color="onSurfaceVariant">{description}</Text>
      </View>
    </Pressable>
  );
}

type ToolsNavProp = StackNavigationProp<RootStackParamList>;

export default function ToolsPanel() {
  const navigation = useNavigation<ToolsNavProp>();
  const {
    compareMode,
    setCompareMode,
    resetAdjustments,
    updateImageSource,
    recipe,
    imageUri,
    imageWidth,
    imageHeight,
  } = useEditorStore();

  const capturedSnapshot = useExportStore((s) => s.capturedSnapshot);

  const [isUpscaling, setIsUpscaling] = useState(false);

  // ─── Upscale: render current pipeline snapshot → save as new source ───
  const handleUpscale = () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Open an image first before upscaling.');
      return;
    }
    Alert.alert(
      'Upscale Image',
      'This saves a full-quality render of your current edits as the new source image, then removes the baked edits so you can keep editing on top.\n\nUse this to preserve quality when sharing or re-editing.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upscale',
          onPress: async () => {
            if (!capturedSnapshot) {
              Alert.alert('Not Ready', 'Tap EXPORT first to capture a snapshot, then try again.');
              return;
            }
            setIsUpscaling(true);
            try {
              const snapshot = capturedSnapshot;
              if (!snapshot) throw new Error('Snapshot failed');

              const base64 = snapshot.encodeToBase64();
              const dest = `${FileSystem.cacheDirectory}upscaled_${Date.now()}.jpg`;
              await FileSystem.writeAsStringAsync(dest, base64, {
                encoding: FileSystem.EncodingType.Base64,
              });

              // Update source — keep existing recipe
              const w = snapshot.width();
              const h = snapshot.height();
              updateImageSource(dest, w, h);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              Alert.alert('Done', `Image updated to ${w}×${h} px.`);
            } catch (e: any) {
              Alert.alert('Failed', e?.message ?? 'Could not process image.');
            } finally {
              setIsUpscaling(false);
            }
          },
        },
      ],
    );
  };

  // ─── Reset all ───
  const handleResetAll = () => {
    Alert.alert(
      'Reset All Adjustments',
      'Clear all edits, presets, and AI styles? This can be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            resetAdjustments();
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          },
        },
      ],
    );
  };

  const handleCompareToggle = () => {
    setCompareMode(!compareMode);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // ─── Edit summary ───
  const hasLightEdits  = recipe.light.exposure !== 0 || recipe.light.contrast !== 0 ||
    recipe.light.highlights !== 0 || recipe.light.shadows !== 0 ||
    recipe.light.whites !== 0 || recipe.light.blacks !== 0;
  const hasColorEdits  = recipe.color.temperature !== 0 || recipe.color.tint !== 0 ||
    recipe.color.vibrance !== 0 || recipe.color.saturation !== 0;
  const hasDetailEdits = recipe.detail.sharpness > 0 || recipe.detail.nrLuminance > 0 || recipe.detail.nrColor > 0;
  const hasPreset      = recipe.preset !== null;
  const hasAIStyle     = recipe.aiStyle !== null;
  const activeCount    = [hasLightEdits, hasColorEdits, hasDetailEdits, hasPreset, hasAIStyle].filter(Boolean).length;

  const mpLabel = imageWidth > 0
    ? `${imageWidth} × ${imageHeight} px  ·  ${((imageWidth * imageHeight) / 1_000_000).toFixed(1)} MP`
    : 'No image loaded';

  return (
    <View style={styles.container}>
      {/* Image Info */}
      <View style={styles.section}>
        <Text variant="labelCaps" color="onSurfaceVariant">IMAGE INFO</Text>
        <Text variant="monoData" color="onSurface" style={styles.infoText}>{mpLabel}</Text>
      </View>

      {/* Edit Summary */}
      <View style={styles.section}>
        <Text variant="labelCaps" color="onSurfaceVariant">EDIT SUMMARY</Text>
        <View style={styles.summaryGrid}>
          <SummaryChip label="Light"    active={hasLightEdits}  />
          <SummaryChip label="Color"    active={hasColorEdits}  />
          <SummaryChip label="Detail"   active={hasDetailEdits} />
          <SummaryChip label="Preset"   active={hasPreset}      />
          <SummaryChip label="AI Style" active={hasAIStyle}     />
        </View>
        <Text variant="monoData" color="onSurfaceVariant">
          {activeCount === 0
            ? 'No adjustments applied'
            : `${activeCount} active group${activeCount > 1 ? 's' : ''}`}
        </Text>
      </View>

      {/* Tools */}
      <View style={styles.section}>
        <Text variant="labelCaps" color="onSurfaceVariant">TOOLS</Text>

        <ToolItem
          icon="compare"
          label="Before / After"
          description={compareMode ? 'Showing original image' : 'Compare edited vs original'}
          onPress={handleCompareToggle}
          active={compareMode}
        />

        <ToolItem
          icon="auto-fix-high"
          label="AI Upscale"
          description="4× neural super-resolution — on-device"
          onPress={() => {
            if (!imageUri) {
              Alert.alert('No Image', 'Open an image first.');
              return;
            }
            Haptics.selectionAsync();
            navigation.navigate('Upscale');
          }}
          disabled={!imageUri}
        />

        <ToolItem
          icon="zoom-in"
          label="Flatten & Enhance"
          description="Bake edits into source for re-editing"
          onPress={handleUpscale}
          loading={isUpscaling}
          disabled={!imageUri || !capturedSnapshot}
        />

        <ToolItem
          icon="restart-alt"
          label="Reset All"
          description="Clear all adjustments"
          onPress={handleResetAll}
          destructive
        />
      </View>

      {/* Help */}
      <View style={styles.section}>
        <Text variant="labelCaps" color="onSurfaceVariant">HELP</Text>
        <ToolItem
          icon="menu-book"
          label="User Guide"
          description="How every option works — explained"
          onPress={() => {
            Haptics.selectionAsync();
            navigation.navigate('Help');
          }}
        />
      </View>
    </View>
  );
}

function SummaryChip({ label, active }: { label: string; active: boolean }) {
  return (
    <View style={[styles.chip, active && styles.chipActive]}>
      <View style={[styles.chipDot, active && styles.chipDotActive]} />
      <Text variant="monoData" color={active ? 'primary' : 'onSurfaceVariant'}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.edgeMargin,
    paddingVertical: spacing.gutter,
  },
  section: {
    marginBottom: spacing.gutter * 2,
    gap: spacing.unit * 2,
  },
  infoText: {
    paddingVertical: spacing.unit,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.unit * 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit,
    paddingHorizontal: spacing.unit * 2,
    paddingVertical: spacing.unit,
    borderRadius: 4,
    backgroundColor: colors.surfaceContainerLow,
  },
  chipActive: {
    backgroundColor: colors.primaryContainer + '30',
  },
  chipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.secondaryContainer,
  },
  chipDotActive: {
    backgroundColor: colors.primary,
  },
  toolItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.unit * 3,
    paddingHorizontal: spacing.unit,
    borderRadius: 8,
    marginTop: spacing.unit,
  },
  toolItemActive: {
    backgroundColor: colors.primaryContainer + '20',
  },
  toolItemDisabled: {
    opacity: 0.45,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.gutter,
  },
  iconContainerActive: {
    backgroundColor: colors.primaryContainer + '40',
  },
  toolText: {
    flex: 1,
    gap: 2,
  },
});
