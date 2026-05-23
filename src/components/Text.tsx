import { Text as RNText, TextProps as RNTextProps } from 'react-native';
import { colors, textStyles, TextVariant } from '../theme';
import { ColorToken } from '../theme/colors';

interface TextProps extends RNTextProps {
  variant?: TextVariant;
  color?: ColorToken;
}

export default function Text({
  variant = 'bodyMd',
  color = 'onSurface',
  style,
  ...props
}: TextProps) {
  return (
    <RNText
      style={[textStyles[variant], { color: colors[color] }, style]}
      {...props}
    />
  );
}
