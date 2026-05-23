import { ScrollView, Pressable, View, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import Text from '../Text';
import type { StyleReference } from '../../engine/StyleTransfer';

interface StyleGalleryProps {
  styles: StyleReference[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function StyleGallery({ styles, selectedId, onSelect }: StyleGalleryProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={galleryStyles.container}
    >
      {styles.map((style) => {
        const isSelected = style.id === selectedId;
        // Generate a preview color swatch from the style profile
        const previewColor = profileToPreviewColor(style);

        return (
          <Pressable
            key={style.id}
            onPress={() => onSelect(style.id)}
            style={[galleryStyles.card, isSelected && galleryStyles.cardSelected]}
          >
            <View style={[galleryStyles.preview, isSelected && galleryStyles.previewSelected]}>
              {/* Gradient-like color preview from the style profile */}
              <View style={[galleryStyles.colorTop, { backgroundColor: previewColor.highlight }]} />
              <View style={[galleryStyles.colorBottom, { backgroundColor: previewColor.shadow }]} />
              <MaterialIcons
                name="auto-awesome"
                size={20}
                color={isSelected ? '#fff' : 'rgba(255,255,255,0.6)'}
                style={galleryStyles.icon}
              />
            </View>
            <Text
              variant="labelSm"
              color={isSelected ? 'primary' : 'onSurface'}
              numberOfLines={1}
            >
              {style.name}
            </Text>
            <Text variant="monoData" color="outline" numberOfLines={2} style={galleryStyles.desc}>
              {style.description}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Convert a style's color profile to preview swatch colors */
function profileToPreviewColor(style: StyleReference) {
  const { meanR, meanG, meanB, shadowDensity, highlightBrightness } = style.profile;

  // Highlight color (brighter, shifted by mean)
  const hR = Math.round(Math.min(255, meanR * highlightBrightness * 320));
  const hG = Math.round(Math.min(255, meanG * highlightBrightness * 320));
  const hB = Math.round(Math.min(255, meanB * highlightBrightness * 320));

  // Shadow color (darker, shifted by mean)
  const sR = Math.round(meanR * shadowDensity * 180);
  const sG = Math.round(meanG * shadowDensity * 180);
  const sB = Math.round(meanB * shadowDensity * 180);

  return {
    highlight: `rgb(${hR}, ${hG}, ${hB})`,
    shadow: `rgb(${sR}, ${sG}, ${sB})`,
  };
}

const galleryStyles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.edgeMargin,
    gap: spacing.gutter,
    paddingVertical: spacing.gutter,
  },
  card: {
    width: 100,
    gap: spacing.unit,
  },
  cardSelected: {},
  preview: {
    width: 100,
    height: 100,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    position: 'relative',
  },
  previewSelected: {
    borderColor: colors.interactiveBlue,
    borderWidth: 2,
  },
  colorTop: {
    flex: 1,
  },
  colorBottom: {
    flex: 1,
  },
  icon: {
    position: 'absolute',
    bottom: 6,
    right: 6,
  },
  desc: {
    lineHeight: 11,
  },
});
