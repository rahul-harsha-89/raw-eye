import { Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import { ColorToken } from '../theme/colors';

interface IconButtonProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  onPress?: () => void;
  color?: ColorToken;
  size?: number;
  disabled?: boolean;
}

export default function IconButton({
  icon,
  onPress,
  color = 'onSurface',
  size = 20,
  disabled = false,
}: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.container,
        { opacity: disabled ? 0.3 : pressed ? 0.7 : 1 },
      ]}
      hitSlop={8}
    >
      <MaterialIcons
        name={icon}
        size={size}
        color={colors[color]}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    width: spacing.touchTarget,
    height: spacing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
