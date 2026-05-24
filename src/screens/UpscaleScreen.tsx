import { useState, useCallback, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Alert,
  Platform,
  StatusBar,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { Image as RNImage } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../theme';
import Text from '../components/Text';
import IconButton from '../components/IconButton';
import { useEditorStore } from '../store/editorStore';
import {
  upscaleImage,
  getOutputDimensions,
  phaseLabel,
  type UpscaleProgress,
  type UpscalePhase,
} from '../engine/UpscaleEngine';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

// ─── Progress bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value }: { value: number }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.round(value * 100)}%` }]} />
    </View>
  );
}

// ─── Stat chip ────────────────────────────────────────────────────────────────

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statRow}>
      <Text variant="monoData" color="onSurfaceVariant">{label}</Text>
      <Text variant="monoData" color="onSurface">{value}</Text>
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

type Stage = 'idle' | 'running' | 'done' | 'error';

export default function UpscaleScreen() {
  const navigation    = useNavigation();
  const { imageUri, imageWidth, imageHeight, updateImageSource } = useEditorStore();

  const [stage,        setStage]        = useState<Stage>('idle');
  const [progress,     setProgress]     = useState<UpscaleProgress>({
    phase: 'loading', tile: 0, totalTiles: 0,
  });
  const [resultUri,    setResultUri]    = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Compute expected output dimensions
  const { outW, outH } = imageWidth > 0
    ? getOutputDimensions(imageWidth, imageHeight)
    : { outW: 0, outH: 0 };

  const inputMP  = imageWidth > 0 ? ((imageWidth  * imageHeight)  / 1_000_000).toFixed(1) : '—';
  const outputMP = outW > 0       ? ((outW * outH) / 1_000_000).toFixed(1) : '—';

  // ── Tile count estimate for time estimate ──────────────────────────────────
  const MAX_INPUT_DIM = 1080;
  const TILE_IN = 50;
  const maxDim  = Math.max(imageWidth, imageHeight);
  const ds      = maxDim > MAX_INPUT_DIM ? MAX_INPUT_DIM / maxDim : 1.0;
  const procW   = Math.round(imageWidth  * ds);
  const procH   = Math.round(imageHeight * ds);
  const estTiles = Math.ceil(procW / TILE_IN) * Math.ceil(procH / TILE_IN);
  // ~20ms per tile on mid-range phone
  const estSeconds = Math.round(estTiles * 0.020);
  const estLabel   = estSeconds < 60
    ? `~${estSeconds}s`
    : `~${Math.round(estSeconds / 60)}m ${estSeconds % 60}s`;

  // ── Progress fraction ─────────────────────────────────────────────────────
  const progressFraction: number = (() => {
    const { phase, tile, totalTiles } = progress;
    if (phase === 'downloading') return 0.01;
    if (phase === 'loading')    return 0.02;
    if (phase === 'resizing')   return 0.05;
    if (phase === 'processing') return totalTiles > 0 ? 0.05 + (tile / totalTiles) * 0.85 : 0.05;
    if (phase === 'stitching')  return 0.92;
    if (phase === 'saving')     return 0.97;
    if (phase === 'done')       return 1.0;
    return 0;
  })();

  // ── Start upscaling ────────────────────────────────────────────────────────
  const handleStart = useCallback(async () => {
    if (!imageUri) {
      Alert.alert('No Image', 'Open an image in the editor first.');
      return;
    }

    setStage('running');
    setResultUri(null);
    setErrorMessage('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const dest = await upscaleImage(imageUri, (p) => {
        setProgress({ ...p });
      });
      setResultUri(dest);
      setStage('done');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: any) {
      setErrorMessage(e?.message ?? 'Upscaling failed.');
      setStage('error');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }, [imageUri]);

  // ── Apply result as new source ─────────────────────────────────────────────
  const handleApply = useCallback(() => {
    if (!resultUri) return;
    updateImageSource(resultUri, outW, outH);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  }, [resultUri, outW, outH, updateImageSource, navigation]);

  // ── Discard ───────────────────────────────────────────────────────────────
  const handleDiscard = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={styles.container}>

      {/* Header */}
      <View style={styles.header}>
        <IconButton
          icon="arrow-back"
          onPress={() => {
            if (stage === 'running') {
              Alert.alert('Processing', 'Upscaling is in progress. Wait for it to finish or it will be cancelled.');
              return;
            }
            navigation.goBack();
          }}
        />
        <Text variant="headlineMd" color="onSurface">AI Upscale</Text>
        <View style={{ width: spacing.touchTarget }} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Image preview */}
        {imageUri ? (
          <View style={styles.previewContainer}>
            <RNImage
              source={{ uri: stage === 'done' && resultUri ? resultUri : imageUri }}
              style={styles.preview}
              resizeMode="contain"
            />
            {stage === 'done' && resultUri && (
              <View style={styles.afterBadge}>
                <Text variant="labelCaps" color="primary">AFTER</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={[styles.previewContainer, styles.noImageBox]}>
            <MaterialIcons name="image-not-supported" size={40} color={colors.outline} />
            <Text variant="monoData" color="onSurfaceVariant">No image loaded</Text>
          </View>
        )}

        {/* Resolution info */}
        <View style={styles.card}>
          <Text variant="labelCaps" color="onSurfaceVariant">RESOLUTION</Text>
          <View style={styles.statsGrid}>
            <StatRow label="Input"  value={imageWidth > 0 ? `${imageWidth} × ${imageHeight}` : '—'} />
            <StatRow label="Input"  value={`${inputMP} MP`} />
            <StatRow label="Output" value={outW > 0 ? `${outW} × ${outH}` : '—'} />
            <StatRow label="Output" value={`${outputMP} MP`} />
          </View>
        </View>

        {/* Info card */}
        <View style={styles.card}>
          <Text variant="labelCaps" color="onSurfaceVariant">HOW IT WORKS</Text>
          <Text variant="monoData" color="onSurfaceVariant" style={styles.infoText}>
            ESRGAN analyses and reconstructs each 50×50 pixel patch using a neural
            network trained on thousands of real images. The result is a 4× resolution
            increase with genuine detail — not just interpolation. All processing is
            done on-device. No internet needed.
          </Text>
          <View style={styles.specRow}>
            <View style={styles.specChip}>
              <MaterialIcons name="memory" size={14} color={colors.primary} />
              <Text variant="monoData" color="primary">On-device</Text>
            </View>
            <View style={styles.specChip}>
              <MaterialIcons name="zoom-in" size={14} color={colors.primary} />
              <Text variant="monoData" color="primary">4× upscale</Text>
            </View>
            <View style={styles.specChip}>
              <MaterialIcons name="timer" size={14} color={colors.primary} />
              <Text variant="monoData" color="primary">{estLabel}</Text>
            </View>
          </View>
        </View>

        {/* Progress / status */}
        {stage === 'running' && (
          <View style={styles.card}>
            <View style={styles.progressHeader}>
              <Text variant="labelSm" color="onSurface">{phaseLabel(progress.phase)}</Text>
              {progress.totalTiles > 0 && (
                <Text variant="monoData" color="onSurfaceVariant">
                  {progress.tile} / {progress.totalTiles} tiles
                </Text>
              )}
            </View>
            <ProgressBar value={progressFraction} />
            <Text variant="monoData" color="onSurfaceVariant" style={{ marginTop: spacing.unit }}>
              {Math.round(progressFraction * 100)}% complete
            </Text>
          </View>
        )}

        {stage === 'error' && (
          <View style={[styles.card, styles.errorCard]}>
            <MaterialIcons name="error-outline" size={20} color={colors.error} />
            <Text variant="labelSm" color="error">Upscaling failed</Text>
            <Text variant="monoData" color="onSurfaceVariant" style={styles.infoText}>
              {errorMessage}
            </Text>
          </View>
        )}

        {/* Action buttons */}
        <View style={styles.actions}>
          {stage === 'idle' || stage === 'error' ? (
            <Pressable
              style={[styles.primaryBtn, !imageUri && styles.btnDisabled]}
              onPress={handleStart}
              disabled={!imageUri}
            >
              <MaterialIcons name="auto-fix-high" size={20} color={colors.onPrimary} />
              <Text variant="labelSm" color="onPrimary">
                {stage === 'error' ? 'Try Again' : 'Start Upscaling'}
              </Text>
            </Pressable>
          ) : stage === 'running' ? (
            <View style={[styles.primaryBtn, styles.btnRunning]}>
              <ActivityIndicator size="small" color={colors.onPrimary} />
              <Text variant="labelSm" color="onPrimary">Processing…</Text>
            </View>
          ) : /* done */ (
            <View style={styles.doneActions}>
              <Pressable style={styles.primaryBtn} onPress={handleApply}>
                <MaterialIcons name="check" size={20} color={colors.onPrimary} />
                <Text variant="labelSm" color="onPrimary">Apply as New Source</Text>
              </Pressable>
              <Pressable style={styles.secondaryBtn} onPress={handleDiscard}>
                <Text variant="labelSm" color="onSurface">Discard</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Warning note */}
        {stage === 'idle' && (
          <View style={styles.noteRow}>
            <MaterialIcons name="info-outline" size={14} color={colors.onSurfaceVariant} />
            <Text variant="monoData" color="onSurfaceVariant" style={styles.noteText}>
              The upscaled image becomes your new source. Your current adjustments
              will be preserved so you can continue editing on top.
            </Text>
          </View>
        )}

      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  scrollContent: {
    paddingBottom: 48,
    paddingHorizontal: spacing.edgeMargin,
    paddingTop: spacing.gutter * 2,
    gap: spacing.gutter * 2,
  },

  // Preview
  previewContainer: {
    width: '100%',
    height: 240,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  noImageBox: {
    gap: spacing.unit * 2,
  },
  afterBadge: {
    position: 'absolute',
    top: spacing.unit * 2,
    right: spacing.unit * 2,
    backgroundColor: colors.primaryContainer + 'CC',
    paddingHorizontal: spacing.unit * 2,
    paddingVertical: spacing.unit,
    borderRadius: 4,
  },

  // Card
  card: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 8,
    padding: spacing.gutter,
    gap: spacing.unit * 2,
  },

  // Stats
  statsGrid: {
    gap: spacing.unit,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.unit / 2,
  },

  // Info
  infoText: {
    lineHeight: 17,
    opacity: 0.85,
  },
  specRow: {
    flexDirection: 'row',
    gap: spacing.unit * 2,
    flexWrap: 'wrap',
    marginTop: spacing.unit,
  },
  specChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit,
    backgroundColor: colors.primaryContainer + '20',
    paddingHorizontal: spacing.unit * 2,
    paddingVertical: spacing.unit,
    borderRadius: 4,
  },

  // Progress
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceContainerHigh,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },

  // Error
  errorCard: {
    borderWidth: 1,
    borderColor: colors.error + '40',
    gap: spacing.unit,
  },

  // Actions
  actions: {
    marginTop: spacing.unit,
  },
  doneActions: {
    gap: spacing.gutter,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.unit * 2,
    height: spacing.touchTarget,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: spacing.touchTarget,
    borderRadius: 8,
    backgroundColor: colors.surfaceContainerHigh,
  },
  btnDisabled: {
    opacity: 0.45,
  },
  btnRunning: {
    opacity: 0.7,
  },

  // Note
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.unit,
    paddingTop: spacing.unit,
  },
  noteText: {
    flex: 1,
    lineHeight: 16,
  },
});
