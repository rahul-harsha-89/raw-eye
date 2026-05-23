import { useCallback } from 'react';
import { View, ScrollView, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import Text from '../Text';
import PrecisionSlider from './PrecisionSlider';
import { usePresetStore } from '../../store/presetStore';
import { useEditorStore } from '../../store/editorStore';
import type { FilmPreset, PresetCategory } from '../../engine/presets';

const CATEGORY_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  'Film Emulation': 'camera-roll',
  'Landscape': 'landscape',
  'Portrait': 'person',
  'Moody & Cinematic': 'movie-filter',
  'Black & White': 'contrast',
  'Creative': 'auto-awesome',
};

export default function InlinePresetPanel() {
  const {
    presets,
    categories,
    selectedPresetId,
    intensity,
    activeCategory,
    selectPreset,
    setIntensity,
    setActiveCategory,
  } = usePresetStore();
  const setPreset = useEditorStore((s) => s.setPreset);

  const filteredPresets = presets.filter((p) => p.category === activeCategory);

  const handleSelect = useCallback((id: string) => {
    if (selectedPresetId === id) {
      selectPreset(null);
      setPreset(null);
    } else {
      selectPreset(id);
      setPreset({ lutId: id, intensity });
    }
  }, [selectedPresetId, intensity, selectPreset, setPreset]);

  const handleIntensityChange = useCallback((value: number) => {
    setIntensity(value);
    if (selectedPresetId) {
      setPreset({ lutId: selectedPresetId, intensity: value });
    }
  }, [selectedPresetId, setIntensity, setPreset]);

  return (
    <View style={styles.container}>
      {/* Category tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoryRow}
      >
        {categories.map((cat) => {
          const isActive = cat === activeCategory;
          return (
            <Pressable
              key={cat}
              onPress={() => setActiveCategory(cat)}
              style={[styles.categoryChip, isActive && styles.categoryChipActive]}
            >
              <MaterialIcons
                name={CATEGORY_ICONS[cat] || 'tune'}
                size={14}
                color={isActive ? colors.surface : colors.onSurfaceVariant}
              />
              <Text
                variant="monoData"
                style={{ color: isActive ? colors.surface : colors.onSurfaceVariant }}
              >
                {cat}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Preset cards */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presetRow}
      >
        {/* None / Reset option */}
        <Pressable
          onPress={() => { selectPreset(null); setPreset(null); }}
          style={[styles.presetCard, !selectedPresetId && styles.presetCardActive]}
        >
          <View style={[styles.presetIcon, !selectedPresetId && styles.presetIconActive]}>
            <MaterialIcons
              name="block"
              size={20}
              color={!selectedPresetId ? colors.interactiveBlue : colors.onSurfaceVariant}
            />
          </View>
          <Text
            variant="monoData"
            color={!selectedPresetId ? 'primary' : 'onSurfaceVariant'}
            numberOfLines={1}
          >
            None
          </Text>
        </Pressable>

        {filteredPresets.map((preset) => {
          const isSelected = preset.id === selectedPresetId;
          return (
            <Pressable
              key={preset.id}
              onPress={() => handleSelect(preset.id)}
              style={[styles.presetCard, isSelected && styles.presetCardActive]}
            >
              <View style={[styles.presetIcon, isSelected && styles.presetIconActive]}>
                <MaterialIcons
                  name={CATEGORY_ICONS[preset.category] || 'tune'}
                  size={20}
                  color={isSelected ? colors.interactiveBlue : colors.onSurfaceVariant}
                />
              </View>
              <Text
                variant="monoData"
                color={isSelected ? 'primary' : 'onSurface'}
                numberOfLines={1}
              >
                {preset.name}
              </Text>
              <Text variant="monoData" color="outline" numberOfLines={1} style={styles.useCase}>
                {preset.useCase}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Intensity slider (visible when a preset is selected) */}
      {selectedPresetId && (
        <View style={styles.intensityRow}>
          <PrecisionSlider
            label="Intensity"
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
  categoryRow: {
    paddingHorizontal: spacing.edgeMargin,
    paddingVertical: spacing.gutter,
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  presetRow: {
    paddingHorizontal: spacing.edgeMargin,
    gap: spacing.gutter,
    paddingBottom: spacing.gutter,
  },
  presetCard: {
    alignItems: 'center',
    width: 72,
    gap: 4,
  },
  presetCardActive: {},
  presetIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  presetIconActive: {
    borderColor: colors.interactiveBlue,
    borderWidth: 2,
    backgroundColor: colors.surfaceContainerHighest,
  },
  useCase: {
    fontSize: 8,
    lineHeight: 10,
    textAlign: 'center',
  },
  intensityRow: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.edgeMargin,
  },
});
