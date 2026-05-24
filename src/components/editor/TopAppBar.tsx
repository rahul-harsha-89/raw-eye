import { View, Pressable, StyleSheet, Platform, StatusBar } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme';
import Text from '../Text';

const STATUS_BAR_HEIGHT = Platform.OS === 'android' ? (StatusBar.currentHeight ?? 24) : 0;

interface TopAppBarProps {
  onBack: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onExport: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onHelp?: () => void;
}

export default function TopAppBar({
  onBack,
  onUndo,
  onRedo,
  onExport,
  canUndo,
  canRedo,
  onHelp,
}: TopAppBarProps) {
  return (
    <View style={styles.container}>
      <View style={styles.left}>
        <Pressable onPress={onBack} style={styles.iconBtn} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={20} color={colors.onSurface} />
        </Pressable>
        <View style={styles.historyButtons}>
          <Pressable
            onPress={onUndo}
            disabled={!canUndo}
            style={[styles.iconBtn, !canUndo && styles.disabled]}
            hitSlop={8}
          >
            <MaterialIcons name="undo" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
          <Pressable
            onPress={onRedo}
            disabled={!canRedo}
            style={[styles.iconBtn, !canRedo && styles.disabled]}
            hitSlop={8}
          >
            <MaterialIcons name="redo" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        </View>
      </View>
      <View style={styles.right}>
        {onHelp && (
          <Pressable onPress={onHelp} style={styles.iconBtn} hitSlop={8}>
            <MaterialIcons name="help-outline" size={20} color={colors.onSurfaceVariant} />
          </Pressable>
        )}
        <Pressable onPress={onExport} style={styles.exportBtn} hitSlop={8}>
          <Text variant="labelCaps" color="primary">EXPORT</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: spacing.touchTarget + STATUS_BAR_HEIGHT,
    paddingTop: STATUS_BAR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.edgeMargin,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondaryContainer,
    backgroundColor: colors.surface,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gutter,
  },
  historyButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit,
  },
  iconBtn: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.unit,
  },
  exportBtn: {
    height: spacing.touchTarget,
    paddingHorizontal: spacing.unit,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
