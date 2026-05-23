import { ScrollView, StyleSheet } from 'react-native';
import PrecisionSlider from './PrecisionSlider';
import { spacing } from '../../theme';
import type { EditorTab } from '../../store/editorStore';
import type { EditRecipe } from '../../engine/EditRecipe';

interface SliderConfig {
  key: string;
  label: string;
  min: number;
  max: number;
  step: number;
  bipolar: boolean;
  defaultValue?: number;
  formatValue?: (v: number) => string;
}

const LIGHT_SLIDERS: SliderConfig[] = [
  { key: 'exposure', label: 'Exposure', min: -5, max: 5, step: 0.1, bipolar: true, defaultValue: 0, formatValue: (v) => v.toFixed(1) },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, step: 1, bipolar: true, defaultValue: 0 },
  { key: 'highlights', label: 'Highlights', min: -100, max: 100, step: 1, bipolar: true, defaultValue: 0 },
  { key: 'shadows', label: 'Shadows', min: -100, max: 100, step: 1, bipolar: true, defaultValue: 0 },
  { key: 'whites', label: 'Whites', min: -100, max: 100, step: 1, bipolar: true, defaultValue: 0 },
  { key: 'blacks', label: 'Blacks', min: -100, max: 100, step: 1, bipolar: true, defaultValue: 0 },
];

const COLOR_SLIDERS: SliderConfig[] = [
  { key: 'temperature', label: 'Temperature', min: -100, max: 100, step: 1, bipolar: true, defaultValue: 0 },
  { key: 'tint', label: 'Tint', min: -100, max: 100, step: 1, bipolar: true, defaultValue: 0 },
  { key: 'vibrance', label: 'Vibrance', min: -100, max: 100, step: 1, bipolar: true, defaultValue: 0 },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, step: 1, bipolar: true, defaultValue: 0 },
];

const DETAIL_SLIDERS: SliderConfig[] = [
  { key: 'sharpness', label: 'Sharpness', min: 0, max: 100, step: 1, bipolar: false },
  { key: 'nrLuminance', label: 'NR Luminance', min: 0, max: 100, step: 1, bipolar: false },
  { key: 'nrColor', label: 'NR Color', min: 0, max: 100, step: 1, bipolar: false },
  { key: 'textureRecovery', label: 'Texture Recovery', min: 0, max: 100, step: 1, bipolar: false },
];

const OPTICS_SLIDERS: SliderConfig[] = [
  { key: 'vignette', label: 'Vignette', min: -100, max: 100, step: 1, bipolar: true, defaultValue: 0 },
];

const GEOMETRY_SLIDERS: SliderConfig[] = [
  { key: 'rotation', label: 'Straighten', min: -45, max: 45, step: 0.1, bipolar: true, defaultValue: 0, formatValue: (v) => `${v.toFixed(1)}°` },
];

const TAB_SLIDERS: Record<EditorTab, { sliders: SliderConfig[]; group: keyof EditRecipe }> = {
  light: { sliders: LIGHT_SLIDERS, group: 'light' },
  color: { sliders: COLOR_SLIDERS, group: 'color' },
  detail: { sliders: DETAIL_SLIDERS, group: 'detail' },
  optics: { sliders: OPTICS_SLIDERS, group: 'optics' },
  geometry: { sliders: GEOMETRY_SLIDERS, group: 'geometry' },
};

interface AdjustmentPanelProps {
  activeTab: EditorTab;
  recipe: EditRecipe;
  onValueChange: (group: string, key: string, value: number) => void;
  onSlidingStart?: () => void;
  onSlidingComplete?: (group: string, key: string, value: number) => void;
}

export default function AdjustmentPanel({
  activeTab,
  recipe,
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
}: AdjustmentPanelProps) {
  const config = TAB_SLIDERS[activeTab];
  if (!config || config.sliders.length === 0) return null;

  const groupValues = recipe[config.group] as unknown as Record<string, number>;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {config.sliders.map((slider) => (
        <PrecisionSlider
          key={slider.key}
          label={slider.label}
          value={groupValues[slider.key] ?? 0}
          min={slider.min}
          max={slider.max}
          step={slider.step}
          bipolar={slider.bipolar}
          defaultValue={slider.defaultValue}
          formatValue={slider.formatValue}
          onValueChange={(v) => onValueChange(config.group, slider.key, v)}
          onSlidingStart={onSlidingStart}
          onSlidingComplete={(v) => onSlidingComplete?.(config.group, slider.key, v)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.edgeMargin,
    paddingVertical: spacing.gutter,
  },
});
