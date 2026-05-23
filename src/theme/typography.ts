import { TextStyle } from 'react-native';

export const fontFamilies = {
  geistRegular: 'Geist-Regular',
  geistMedium: 'Geist-Medium',
  geistSemiBold: 'Geist-SemiBold',
  jetBrainsMonoRegular: 'JetBrainsMono-Regular',
  jetBrainsMonoMedium: 'JetBrainsMono-Medium',
} as const;

export const textStyles = {
  displaySm: {
    fontFamily: fontFamilies.geistSemiBold,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.48,
  } satisfies TextStyle,

  headlineMd: {
    fontFamily: fontFamilies.geistMedium,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.18,
  } satisfies TextStyle,

  bodyMd: {
    fontFamily: fontFamilies.geistRegular,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  } satisfies TextStyle,

  labelSm: {
    fontFamily: fontFamilies.geistMedium,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0,
  } satisfies TextStyle,

  labelCaps: {
    fontFamily: fontFamilies.jetBrainsMonoMedium,
    fontSize: 11,
    lineHeight: 16,
    letterSpacing: 0.88,
    textTransform: 'uppercase',
  } satisfies TextStyle,

  monoData: {
    fontFamily: fontFamilies.jetBrainsMonoRegular,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0,
  } satisfies TextStyle,
} as const;

export type TextVariant = keyof typeof textStyles;
