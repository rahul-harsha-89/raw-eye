import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Image, View, StyleSheet, useWindowDimensions } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import type { RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { colors } from '../theme';
import Text from '../components/Text';
import { useEditorStore } from '../store/editorStore';
import { useExportStore } from '../store/exportStore';
import { useProjectStore } from '../store/projectStore';
import { createDefaultRecipe } from '../engine/EditRecipe';
import type { RootStackParamList } from '../navigation/RootNavigator';
import RenderPipeline, { type RenderPipelineRef } from '../engine/RenderPipeline';
import TopAppBar from '../components/editor/TopAppBar';
import HistogramOverlay from '../components/editor/HistogramOverlay';
import AdjustmentPanel from '../components/editor/AdjustmentPanel';
import ToolRibbon from '../components/editor/ToolRibbon';
import BottomNavBar from '../components/editor/BottomNavBar';
import InlinePresetPanel from '../components/editor/InlinePresetPanel';
import InlineAIStylePanel from '../components/editor/InlineAIStylePanel';
import ToolsPanel from '../components/editor/ToolsPanel';
import CropOverlay from '../components/editor/CropOverlay';

type EditorNavProp = StackNavigationProp<RootStackParamList, 'Editor'>;
type EditorRouteProp = RouteProp<RootStackParamList, 'Editor'>;

export default function EditorScreen() {
  const navigation = useNavigation<EditorNavProp>();
  const route = useRoute<EditorRouteProp>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const pipelineRef = useRef<RenderPipelineRef>(null);

  const {
    recipe,
    imageUri: storeImageUri,
    activeTab,
    activeBottomNav,
    compareMode,
    setActiveTab,
    setActiveBottomNav,
    updateField,
    pushUndo,
    undo,
    redo,
    canUndo,
    canRedo,
    loadImage,
  } = useEditorStore();

  const setCapturedSnapshot = useExportStore((s) => s.setCapturedSnapshot);
  const [histogramVisible, setHistogramVisible] = useState(true);

  // Initialise store image on first mount so Tools panel can access dimensions
  const routeImageUri = route.params?.imageUri ?? '';
  useEffect(() => {
    if (!routeImageUri) return;
    Image.getSize(
      routeImageUri,
      (w, h) => loadImage(routeImageUri, w, h),
      () => loadImage(routeImageUri, 0, 0),  // Unknown dims — still set uri
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeImageUri]);

  // Save project to recent-edits when user navigates away
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', () => {
      const { imageUri: uri, recipe: r } = useEditorStore.getState();
      if (uri) {
        useProjectStore.getState().saveProject(uri, r);
      }
    });
    return unsubscribe;
  }, [navigation]);

  // Use store URI if available (upscale updates it), fall back to route param
  const imageUri = storeImageUri ?? routeImageUri;
  const canvasHeight = screenHeight * 0.45;

  // In compare mode, pass a default recipe (no adjustments) to the pipeline
  const effectiveRecipe = useMemo(
    () => compareMode ? createDefaultRecipe() : recipe,
    [compareMode, recipe],
  );

  // Slider value change — live update, no undo push
  const handleValueChange = useCallback((group: string, key: string, value: number) => {
    updateField(group, key, value);
  }, [updateField]);

  // Push undo at start of slider interaction
  const handleSlidingStart = useCallback(() => {
    pushUndo();
  }, [pushUndo]);

  const handleExport = useCallback(() => {
    try {
      // Capture snapshot NOW while canvas is fully rendered and surface is attached.
      // Calling makeImageSnapshot after navigating away crashes on Android because
      // the Skia surface detaches when the screen is covered by another screen.
      const snapshot = pipelineRef.current?.makeSnapshot() ?? null;
      setCapturedSnapshot(snapshot);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      navigation.navigate('Export');
    } catch (e) {
      // Navigation failed — no-op (user stays on editor)
    }
  }, [navigation, setCapturedSnapshot]);

  // Bottom nav just switches panels — no navigation
  const handleBottomNavChange = useCallback((tab: typeof activeBottomNav) => {
    setActiveBottomNav(tab);
  }, [setActiveBottomNav]);

  return (
    <View style={styles.container}>
      <TopAppBar
        onBack={() => navigation.goBack()}
        onUndo={undo}
        onRedo={redo}
        onExport={handleExport}
        canUndo={canUndo()}
        canRedo={canRedo()}
        onHelp={() => navigation.navigate('Help')}
      />

      <View style={[styles.canvas, { height: canvasHeight }]}>
        {histogramVisible && (
          <HistogramOverlay onClose={() => setHistogramVisible(false)} />
        )}
        {compareMode && (
          <View style={styles.compareLabel}>
            <View style={styles.compareBadge}>
              <Text variant="labelCaps" color="white">ORIGINAL</Text>
            </View>
          </View>
        )}
        {imageUri ? (
          <RenderPipeline
            ref={pipelineRef}
            imageUri={imageUri}
            recipe={effectiveRecipe}
            width={screenWidth}
            height={canvasHeight}
          />
        ) : (
          <View style={styles.placeholder} />
        )}
        {activeBottomNav === 'edit' && activeTab === 'geometry' && imageUri && (
          <CropOverlay canvasWidth={screenWidth} canvasHeight={canvasHeight} />
        )}
      </View>

      <View style={styles.controls}>
        {activeBottomNav === 'edit' && (
          <>
            <AdjustmentPanel
              activeTab={activeTab}
              recipe={recipe}
              onValueChange={handleValueChange}
              onSlidingStart={handleSlidingStart}
            />
            <ToolRibbon
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </>
        )}

        {activeBottomNav === 'presets' && (
          <InlinePresetPanel />
        )}

        {activeBottomNav === 'aiStyle' && (
          <InlineAIStylePanel />
        )}

        {activeBottomNav === 'tools' && (
          <ToolsPanel />
        )}
      </View>

      <BottomNavBar
        activeTab={activeBottomNav}
        onTabChange={handleBottomNavChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  canvas: {
    backgroundColor: '#000',
    position: 'relative',
  },
  placeholder: {
    flex: 1,
    backgroundColor: '#000',
  },
  controls: {
    flex: 1,
    backgroundColor: '#121212',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  compareLabel: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
  },
  compareBadge: {
    backgroundColor: 'rgba(0,122,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});
