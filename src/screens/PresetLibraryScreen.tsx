import { useCallback } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../theme';
import Text from '../components/Text';
import PresetCard from '../components/presets/PresetCard';
import IntensitySlider from '../components/presets/IntensitySlider';
import IconButton from '../components/IconButton';
import { usePresetStore } from '../store/presetStore';
import { useEditorStore } from '../store/editorStore';

export default function PresetLibraryScreen() {
  const navigation = useNavigation();
  const { presets, selectedPresetId, intensity, selectPreset, setIntensity } = usePresetStore();
  const setPreset = useEditorStore((s) => s.setPreset);

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

  const categories = [...new Set(presets.map((p) => p.category))];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text variant="headlineMd" color="onSurface">Presets</Text>
        <View style={{ width: spacing.touchTarget }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {categories.map((category) => (
          <View key={category} style={styles.section}>
            <Text variant="labelCaps" color="outline" style={styles.sectionTitle}>
              {category}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
              {presets
                .filter((p) => p.category === category)
                .map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    isSelected={selectedPresetId === preset.id}
                    onPress={() => handleSelect(preset.id)}
                  />
                ))}
            </ScrollView>
          </View>
        ))}
      </ScrollView>

      {selectedPresetId && (
        <View style={styles.intensityContainer}>
          <IntensitySlider value={intensity} onValueChange={handleIntensityChange} />
        </View>
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
    height: spacing.touchTarget,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.edgeMargin,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  scroll: {
    flex: 1,
  },
  section: {
    paddingTop: spacing.edgeMargin,
    gap: spacing.gutter,
  },
  sectionTitle: {
    paddingHorizontal: spacing.edgeMargin,
  },
  row: {
    paddingHorizontal: spacing.edgeMargin,
    gap: spacing.gutter,
  },
  intensityContainer: {
    paddingVertical: spacing.gutter,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
