import { useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, spacing } from '../theme';
import Text from '../components/Text';
import IconButton from '../components/IconButton';
import StyleGallery from '../components/ai/StyleGallery';
import AnalysisStatus from '../components/ai/AnalysisStatus';
import IntensitySlider from '../components/presets/IntensitySlider';
import { useAIStyleStore } from '../store/aiStyleStore';
import { useEditorStore } from '../store/editorStore';

export default function AIStyleScreen() {
  const navigation = useNavigation();
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

  // Simulate processing delay (will be real TFLite inference in v2)
  useEffect(() => {
    if (processingState === 'processing' && selectedStyleId) {
      const timer = setTimeout(() => {
        setProcessingState('done');
        setAIStyle({ modelId: selectedStyleId, intensity });
      }, 800);
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
    <View style={screenStyles.container}>
      <View style={screenStyles.header}>
        <IconButton icon="arrow-back" onPress={() => navigation.goBack()} />
        <Text variant="headlineMd" color="onSurface">AI Style Match</Text>
        <View style={{ width: spacing.touchTarget }} />
      </View>

      <View style={screenStyles.content}>
        <Text variant="labelCaps" color="outline" style={screenStyles.sectionLabel}>
          STYLE REFERENCES
        </Text>
        <StyleGallery
          styles={aiStyles}
          selectedId={selectedStyleId}
          onSelect={handleSelect}
        />

        <AnalysisStatus state={processingState} />

        {selectedStyleId && processingState === 'done' && (
          <View style={screenStyles.intensityContainer}>
            <IntensitySlider value={intensity} onValueChange={handleIntensityChange} />
          </View>
        )}
      </View>
    </View>
  );
}

const screenStyles = StyleSheet.create({
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
  content: {
    flex: 1,
    paddingTop: spacing.edgeMargin,
  },
  sectionLabel: {
    paddingHorizontal: spacing.edgeMargin,
    marginBottom: spacing.gutter,
  },
  intensityContainer: {
    paddingTop: spacing.edgeMargin,
  },
});
