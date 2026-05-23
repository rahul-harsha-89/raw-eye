import { ScrollView, Pressable, View, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';
import Text from '../Text';
import type { EditorTab } from '../../store/editorStore';

const TABS: { key: EditorTab; label: string }[] = [
  { key: 'light', label: 'Light' },
  { key: 'color', label: 'Color' },
  { key: 'detail', label: 'Detail' },
  { key: 'optics', label: 'Optics' },
  { key: 'geometry', label: 'Geometry' },
];

interface ToolRibbonProps {
  activeTab: EditorTab;
  onTabChange: (tab: EditorTab) => void;
}

export default function ToolRibbon({ activeTab, onTabChange }: ToolRibbonProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        {TABS.map((tab) => {
          const isActive = tab.key === activeTab;
          return (
            <Pressable
              key={tab.key}
              onPress={() => onTabChange(tab.key)}
              style={styles.tab}
            >
              <Text
                variant="labelSm"
                style={{ color: isActive ? colors.interactiveBlue : colors.onSurfaceVariant }}
              >
                {tab.label}
              </Text>
              {isActive && <View style={styles.indicator} />}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  content: {
    paddingHorizontal: spacing.edgeMargin,
  },
  tab: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.gutter,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: colors.interactiveBlue,
  },
});
