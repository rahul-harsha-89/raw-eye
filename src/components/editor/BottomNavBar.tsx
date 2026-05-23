import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import type { BottomNavTab } from '../../store/editorStore';

const TABS: { key: BottomNavTab; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { key: 'edit', icon: 'edit' },
  { key: 'presets', icon: 'filter-b-and-w' },
  { key: 'aiStyle', icon: 'auto-fix-high' },
  { key: 'tools', icon: 'construction' },
];

interface BottomNavBarProps {
  activeTab: BottomNavTab;
  onTabChange: (tab: BottomNavTab) => void;
}

export default function BottomNavBar({ activeTab, onTabChange }: BottomNavBarProps) {
  return (
    <View style={styles.container}>
      {TABS.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <Pressable
            key={tab.key}
            onPress={() => onTabChange(tab.key)}
            style={[styles.tab, isActive && styles.activeTab]}
          >
            <MaterialIcons
              name={tab.icon}
              size={20}
              color={isActive ? colors.primary : colors.onSurfaceVariant}
            />
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 64,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.secondaryContainer,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.edgeMargin,
  },
  tab: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    transform: [{ scale: 1.1 }],
  },
});
