import { useCallback } from 'react';
import { View, Pressable, StyleSheet, ActivityIndicator, Platform, StatusBar, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { MaterialIcons } from '@expo/vector-icons';
import { ImageFormat, Skia } from '@shopify/react-native-skia';
import { colors, spacing } from '../theme';
import Text from '../components/Text';
import IconButton from '../components/IconButton';
import PrecisionSlider from '../components/editor/PrecisionSlider';
import { useExportStore, type ExportFormat } from '../store/exportStore';
import { useEditorStore } from '../store/editorStore';
import { saveToGallery } from '../engine/ExportManager';
import { renderFullResExport } from '../engine/ExportRenderer';
import { requestMediaLibraryPermission } from '../utils/permissions';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;
const FORMATS: ExportFormat[] = ['jpeg', 'png'];

// Standard fixed export sizes — device-independent.
// targetWidth/targetHeight of 0 = use source image resolution (Original).
const EXPORT_SIZES = [
  { key: 'original', label: 'Original', badge: 'Full source resolution', targetWidth: 0,    targetHeight: 0    },
  { key: 'social',   label: 'Social',   badge: '1080 × 1080',            targetWidth: 1080, targetHeight: 1080 },
  { key: 'hd',       label: 'HD',       badge: '1920 × 1080',            targetWidth: 1920, targetHeight: 1080 },
  { key: '4k',       label: '4K',       badge: '3840 × 2160',            targetWidth: 3840, targetHeight: 2160 },
  { key: 'print',    label: 'Print A4', badge: '3508 × 2480  ·  300dpi', targetWidth: 3508, targetHeight: 2480 },
] as const;

export default function ExportScreen() {
  const navigation = useNavigation();
  const { imageWidth, imageHeight } = useEditorStore();
  const {
    format, quality, resolution,
    keepMetadata, exportState, errorMessage, capturedSnapshot,
    setFormat, setQuality, setResolution, setKeepMetadata,
    setExportState, setErrorMessage, reset,
  } = useExportStore();

  // Find the active size; fall back to Original if key not recognised
  const activeSize = EXPORT_SIZES.find((s) => s.key === resolution) ?? EXPORT_SIZES[0];

  const handleSizePress = (size: typeof EXPORT_SIZES[number]) => {
    setResolution(size.key, size.targetWidth, size.targetHeight);
    Haptics.selectionAsync();
  };

  const handleExport = useCallback(async () => {
    const permission = await requestMediaLibraryPermission();
    if (permission !== 'granted') {
      setErrorMessage('Gallery permission denied. Please allow access in Settings.');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setExportState('rendering');
    setErrorMessage(null);

    try {
      // ── Primary path: render from original source image at full resolution ──
      // This uses the actual camera pixels, not the tiny preview canvas snapshot.
      const { imageUri: srcUri, recipe: srcRecipe } = useEditorStore.getState();
      // For 'original', pass 0×0 sentinel → ExportRenderer uses source dimensions unchanged
      const targetW = activeSize.targetWidth;
      const targetH = activeSize.targetHeight;
      let snapshot = srcUri
        ? await renderFullResExport(srcUri, srcRecipe, targetW, targetH)
        : null;

      // ── Fallback: use the preview snapshot captured before navigating ────
      if (!snapshot) {
        if (!capturedSnapshot) {
          setExportState('error');
          setErrorMessage('No image captured. Go back to the editor and tap EXPORT again.');
          return;
        }
        snapshot = capturedSnapshot;

        // Downscale preview if it somehow exceeds the target
        const snapW = snapshot.width();
        const snapH = snapshot.height();
        const tw = activeSize.targetWidth;
        const th = activeSize.targetHeight;
        if (snapW > tw || snapH > th) {
          try {
            const scale = Math.min(tw / snapW, th / snapH);
            const finalW = Math.round(snapW * scale);
            const finalH = Math.round(snapH * scale);
            const surface = Skia.Surface.Make(finalW, finalH);
            if (surface) {
              const canvas = surface.getCanvas();
              const paint = Skia.Paint();
              canvas.drawImageRect(
                snapshot,
                Skia.XYWHRect(0, 0, snapW, snapH),
                Skia.XYWHRect(0, 0, finalW, finalH),
                paint,
              );
              const resized = surface.makeImageSnapshot();
              if (resized) snapshot = resized;
            }
          } catch {
            // Resize failed — save at fallback snapshot size
          }
        }
      }
      // ─────────────────────────────────────────────────────────────────────

      setExportState('saving');

      const skiaFormat = format === 'png' ? ImageFormat.PNG : ImageFormat.JPEG;
      const q = format === 'jpeg' ? quality : 100;
      const encoded = snapshot.encodeToBase64(skiaFormat, q);
      if (!encoded || encoded.length === 0) throw new Error('Image encoding produced empty output.');

      await saveToGallery(encoded, format);

      setExportState('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setExportState('error');
      setErrorMessage(err?.message ?? 'Export failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [capturedSnapshot, format, quality, activeSize, setExportState, setErrorMessage]);

  const handleDone  = useCallback(() => { reset(); navigation.goBack(); }, [reset, navigation]);
  const handleRetry = useCallback(() => { setExportState('idle'); setErrorMessage(null); }, [setExportState, setErrorMessage]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text variant="headlineMd" color="onSurface">Export</Text>
        <View style={{ width: spacing.touchTarget }} />
      </View>

      {exportState === 'done' ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="check-circle" size={52} color={colors.primary} />
          <Text variant="headlineMd" color="onSurface">Saved</Text>
          <Text variant="monoData" color="outline">SAVED TO GALLERY</Text>
          <Pressable onPress={handleDone} style={styles.actionBtn}>
            <Text variant="labelSm" style={{ color: colors.onPrimary }}>DONE</Text>
          </Pressable>
        </View>

      ) : exportState === 'error' ? (
        <View style={styles.centerContainer}>
          <MaterialIcons name="error-outline" size={52} color={colors.error} />
          <Text variant="headlineMd" color="onSurface">Export Failed</Text>
          <Text variant="monoData" color="outline" style={styles.errorText}>
            {errorMessage ?? 'UNKNOWN ERROR'}
          </Text>
          <Pressable onPress={handleRetry} style={styles.actionBtn}>
            <Text variant="labelSm" style={{ color: colors.onPrimary }}>RETRY</Text>
          </Pressable>
          <Pressable onPress={handleDone} style={styles.secondaryBtn}>
            <Text variant="monoData" color="onSurfaceVariant">CANCEL</Text>
          </Pressable>
        </View>

      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

          {/* Format */}
          <View style={styles.section}>
            <Text variant="labelCaps" color="outline">FORMAT</Text>
            <View style={styles.chipRow}>
              {FORMATS.map((f) => (
                <Pressable
                  key={f}
                  onPress={() => { setFormat(f); Haptics.selectionAsync(); }}
                  style={[styles.chip, format === f && styles.chipActive]}
                >
                  <Text variant="labelSm" color={format === f ? 'primary' : 'onSurfaceVariant'}>
                    {f.toUpperCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          {/* Quality (JPEG only) */}
          {format === 'jpeg' && (
            <View style={styles.section}>
              <PrecisionSlider
                label="Quality"
                value={quality}
                min={1}
                max={100}
                step={1}
                formatValue={(v) => `${Math.round(v)}%`}
                onValueChange={setQuality}
              />
            </View>
          )}

          {/* Output Size */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="labelCaps" color="outline">OUTPUT SIZE</Text>
              {imageWidth > 0 && (
                <Text variant="monoData" color="onSurfaceVariant">
                  Source: {imageWidth}×{imageHeight}
                </Text>
              )}
            </View>
            <View style={styles.resolutionGrid}>
              {EXPORT_SIZES.map((size) => {
                const isSelected = size.key === activeSize.key;
                // For Original, show actual source dimensions + MP count
                const badge = size.key === 'original' && imageWidth > 0
                  ? `${imageWidth} × ${imageHeight}  ·  ${((imageWidth * imageHeight) / 1_000_000).toFixed(1)} MP`
                  : size.badge;
                return (
                  <Pressable
                    key={size.key}
                    onPress={() => handleSizePress(size)}
                    style={[
                      styles.resolutionChip,
                      isSelected && styles.resolutionChipActive,
                    ]}
                  >
                    <Text
                      variant="labelSm"
                      color={isSelected ? 'primary' : 'onSurface'}
                    >
                      {size.label}
                    </Text>
                    <Text variant="monoData" color="onSurfaceVariant">
                      {badge}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Metadata */}
          <View style={styles.section}>
            <Pressable onPress={() => setKeepMetadata(!keepMetadata)} style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text variant="labelSm" color="onSurface">Keep EXIF Metadata</Text>
                <Text variant="monoData" color="onSurfaceVariant">Preserve camera settings in file</Text>
              </View>
              <MaterialIcons
                name={keepMetadata ? 'toggle-on' : 'toggle-off'}
                size={32}
                color={keepMetadata ? colors.interactiveBlue : colors.outline}
              />
            </Pressable>
          </View>

          {/* Export button */}
          <View style={styles.exportBtnContainer}>
            {(exportState === 'rendering' || exportState === 'saving') ? (
              <View style={styles.processingRow}>
                <ActivityIndicator color={colors.interactiveBlue} />
                <Text variant="monoData" color="onSurfaceVariant">
                  {exportState === 'rendering' ? 'RENDERING...' : 'SAVING TO GALLERY...'}
                </Text>
              </View>
            ) : (
              <Pressable onPress={handleExport} style={styles.exportBtn}>
                <Text variant="labelCaps" style={{ color: colors.onPrimary }}>SAVE TO GALLERY</Text>
              </Pressable>
            )}
          </View>

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    height: spacing.touchTarget + STATUS_BAR_HEIGHT,
    paddingTop: STATUS_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.edgeMargin,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scroll: { flex: 1 },
  content: { paddingTop: spacing.edgeMargin, paddingBottom: 40 },
  section: {
    paddingHorizontal: spacing.edgeMargin,
    paddingVertical: spacing.gutter,
    gap: spacing.gutter,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    gap: spacing.gutter,
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
  resolutionGrid: {
    gap: spacing.unit * 2,
  },
  resolutionChip: {
    paddingHorizontal: spacing.edgeMargin,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 2,
  },
  resolutionChipActive: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainerHigh,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.gutter,
  },
  exportBtnContainer: {
    paddingHorizontal: spacing.edgeMargin,
    paddingTop: 32,
    alignItems: 'center',
  },
  exportBtn: {
    width: '100%',
    height: spacing.touchTarget,
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gutter,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.gutter,
    paddingHorizontal: spacing.edgeMargin,
  },
  actionBtn: {
    marginTop: 24,
    paddingHorizontal: 40,
    height: spacing.touchTarget,
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtn: {
    paddingHorizontal: 24,
    height: spacing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 18,
  },
});
