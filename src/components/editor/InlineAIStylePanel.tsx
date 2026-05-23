import { useCallback, useEffect } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import Text from '../Text';
import PrecisionSlider from './PrecisionSlider';
import { useAIStyleStore } from '../../store/aiStyleStore';
import { useEditorStore } from '../../store/editorStore';
import type { StyleReference } from '../../engine/StyleTransfer';

function profileToColors(style: StyleReference) {
  const { meanR, meanG, meanB, shadowDensity, highlightBrightness } = style.profile;
  const hR = Math.round(Math.min(255, meanR * highlightBrightness * 320));
  const hG = Math.round(Math.min(255, meanG * highlightBrightness * 320));
  const hB = Math.round(Math.min(255, meanB * highlightBrightness * 320));
  const sR = Math.round(meanR * shadowDensity * 180);
  const sG = Math.round(meanG * shadowDensity * 180);
  const sB = Math.round(meanB * shadowDensity * 180);
  return {
    highlight: `rgb(${hR}, ${hG}, ${hB})`,
    shadow: `rgb(${sR}, ${sG}, ${sB})`,
  };
}

export default function InlineAIStylePanel() {
  const {
    styles: aiStyles,
    selectedStyleId,
    intensity,
    processingState,
    selectStyle,
    setIntensity,
    setProcessingState,
  } = useAIStyleStore();
  const setAIStyle = useEditorStore((s) => s.setAIStyle);

  const handleSelect = useCallback((id: string) => {
    if (selectedStyleId === id) {
      selectStyle(null);
      setAIStyle(null);
    } else {
      selectStyle(id);
    }
  }, [selectedStyleId, selectStyle, setAIStyle]);

  // Simulate brief processing delay
  useEffect(() => {
    if (processingState === 'processing' && selectedStyleId) {
      const timer = setTimeout(() => {
        setProcessingState('done');
        setAIStyle({ modelId: selectedStyleId, intensity });
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [processingState, selectedStyleId, intensity, setProcessingState, setAIStyle]);

  const handleIntensityChange = useCallback((value: number) => {
    setIntensity(value);
    if (selectedStyleId) {
      setAIStyle({ modelId: selectedStyleId, intensity: value });
    }
  }, [selectedStyleId, setIntensity, setAIStyle]);

  return (
    <View style={styles.container}>
      <Text variant="labelCaps" color="outline" style={styles.sectionLabel}>
        AI STYLE TRANSFER
      </Text>

      {/* Style cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.styleRow}
      >
        {/* Reset / None */}
        <Pressable
          onPress={() => { selectStyle(null); setAIStyle(null); }}
          style={styles.styleCard}
        >
          <View style={[styles.preview, !selectedStyleId && styles.previewSelected]}>
            <MaterialIcons name="block" size={24} color={colors.onSurfaceVariant} />
          </View>
          <Text variant="monoData" color={!selectedStyleId ? 'primary' : 'onSurfaceVariant'}>
            None
          </Text>
        </Pressable>

        {aiStyles.map((style) => {
          const isSelected = style.id === selectedStyleId;
          const previewColors = profileToColors(style);
          return (
            <Pressable
              key={style.id}
              onPress={() => handleSelect(style.id)}
              style={styles.styleCard}
            >
              <View style={[styles.preview, isSelected && styles.previewSelected]}>
                <View style={[styles.colorTop, { backgroundColor: previewColors.highlight }]} />
                <View style={[styles.colorBottom, { backgroundColor: previewColors.shadow }]} />
                <MaterialIcons
                  name="auto-awesome"
                  size={16}
                  color="rgba(255,255,255,0.7)"
                  style={styles.sparkle}
                />
              </View>
              <Text
                variant="monoData"
                color={isSelected ? 'primary' : 'onSurface'}
                numberOfLines={1}
              >
                {style.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Processing status */}
      {processingState === 'processing' && (
        <View style={styles.processingRow}>
          <MaterialIcons name="hourglass-top" size={14} color={colors.interactiveBlue} />
          <Text variant="monoData" color="primary">ANALYZING STYLE...</Text>
        </View>
      )}

      {/* Intensity slider */}
      {selectedStyleId && processingState === 'done' && (
        <View style={styles.intensityRow}>
          <PrecisionSlider
            label="Style Intensity"
            value={intensity}
            min={0}
            max={100}
            step={1}
            bipolar={false}
            formatValue={(v) => `${Math.round(v)}%`}
            onValueChange={handleIntensityChange}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionLabel: {
    paddingHorizontal: spacing.edgeMargin,
    paddingTop: spacing.gutter,
    paddingBottom: 8,
  },
  styleRow: {
    paddingHorizontal: spacing.edgeMargin,
    gap: spacing.gutter,
    paddingBottom: spacing.gutter,
  },
  styleCard: {
    alignItems: 'center',
    width: 80,
    gap: 4,
  },
  preview: {
    width: 64,
    height: 64,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainerHigh,
  },
  previewSelected: {
    borderColor: colors.interactiveBlue,
    borderWidth: 2,
  },
  colorTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  colorBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  sparkle: {
    zIndex: 1,
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.edgeMargin,
    paddingVertical: 8,
  },
  intensityRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.edgeMargin,
  },
});
