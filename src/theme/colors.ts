export const colors = {
  surface: '#131313',
  surfaceDim: '#131313',
  surfaceContainerLowest: '#0E0E0E',
  surfaceContainerLow: '#1B1C1C',
  surfaceContainer: '#1F2020',
  surfaceContainerHigh: '#2A2A2A',
  surfaceContainerHighest: '#353535',
  surfaceBright: '#393939',
  surfaceVariant: '#353535',

  primary: '#ADC6FF',
  primaryContainer: '#4B8EFF',
  onPrimary: '#002E69',
  onPrimaryContainer: '#00285C',
  inversePrimary: '#005BC1',

  secondary: '#C6C6C7',
  secondaryContainer: '#454747',
  onSecondary: '#2F3131',
  onSecondaryContainer: '#B4B5B5',

  tertiary: '#C8C6C5',
  tertiaryContainer: '#929090',

  onSurface: '#E4E2E1',
  onSurfaceVariant: '#C1C6D7',
  onBackground: '#E4E2E1',
  background: '#131313',

  outline: '#8B90A0',
  outlineVariant: '#414755',

  error: '#FFB4AB',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',

  interactiveBlue: '#007AFF',
  border: '#2C2C2C',

  inverseSurface: '#E4E2E1',
  inverseOnSurface: '#303030',

  black: '#000000',
  white: '#FFFFFF',
  transparent: 'transparent',
} as const;

export type ColorToken = keyof typeof colors;
