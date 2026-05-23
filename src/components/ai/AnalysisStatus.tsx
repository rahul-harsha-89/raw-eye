import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';
import Text from '../Text';

interface AnalysisStatusProps {
  state: 'idle' | 'processing' | 'done' | 'error';
}

export default function AnalysisStatus({ state }: AnalysisStatusProps) {
  if (state === 'idle') return null;

  return (
    <View style={styles.container}>
      {state === 'processing' && (
        <>
          <ActivityIndicator size="small" color={colors.interactiveBlue} />
          <Text variant="monoData" color="onSurfaceVariant">ANALYZING STYLE...</Text>
        </>
      )}
      {state === 'done' && (
        <Text variant="monoData" color="primary">STYLE APPLIED</Text>
      )}
      {state === 'error' && (
        <Text variant="monoData" color="error">PROCESSING FAILED</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gutter,
    paddingHorizontal: spacing.edgeMargin,
    paddingVertical: spacing.gutter,
  },
});
