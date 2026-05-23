import { Pressable, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import Text from '../Text';
import type { FilmPreset } from '../../engine/presets';

interface PresetCardProps {
  preset: FilmPreset;
  isSelected: boolean;
  onPress: () => void;
}

/** Icon per category for visual identification */
const CATEGORY_ICONS: Record<string, string> = {
  'Film Emulation': 'camera-roll',
  'Landscape': 'landscape',
  'Portrait': 'person',
  'Moody & Cinematic': 'movie-filter',
  'Black & White': 'contrast',
  'Creative': 'auto-awesome',
};

export default function PresetCard({ preset, isSelected, onPress }: PresetCardProps) {
  const icon = CATEGORY_ICONS[preset.category] ?? 'tune';

  return (
    <Pressable onPress={onPress} style={[styles.card, isSelected && styles.selected]}>
      <View style={[styles.preview, isSelected && styles.previewSelected]}>
        <MaterialIcons
          name={icon as any}
          size={24}
          color={isSelected ? colors.primary : colors.outline}
        />
      </View>
      <Text
        variant="labelSm"
        color={isSelected ? 'primary' : 'onSurfaceVariant'}
        numberOfLines={1}
      >
        {preset.name}
      </Text>
      <Text variant="monoData" color="outline" numberOfLines={2} style={styles.desc}>
        {preset.useCase}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 88,
    gap: spacing.unit,
    alignItems: 'center',
  },
  selected: {},
  preview: {
    width: 76,
    height: 76,
    borderRadius: 10,
    backgroundColor: colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewSelected: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.surfaceContainer,
  },
  desc: {
    textAlign: 'center',
    lineHeight: 11,
  },
});
