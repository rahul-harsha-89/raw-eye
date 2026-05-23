import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import Text from './Text';

interface Props {
  children: React.ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that catches render errors and shows a recovery UI.
 * Prevents the entire app from crashing on shader/rendering failures.
 */
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // In production, this would log to a crash reporting service
    console.error('[ErrorBoundary]', error.message, errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <MaterialIcons name="error-outline" size={40} color={colors.error} />
          <Text variant="headlineMd" color="onSurface" style={styles.title}>
            Something went wrong
          </Text>
          <Text variant="monoData" color="outline" style={styles.message}>
            {this.props.fallbackMessage ?? this.state.error?.message ?? 'UNKNOWN ERROR'}
          </Text>
          <Pressable onPress={this.handleRetry} style={styles.retryBtn}>
            <MaterialIcons name="refresh" size={20} color={colors.onPrimary} />
            <Text variant="labelSm" style={{ color: colors.onPrimary }}>RETRY</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.edgeMargin,
    gap: spacing.gutter,
  },
  title: {
    marginTop: 8,
  },
  message: {
    textAlign: 'center',
    maxWidth: 280,
  },
  retryBtn: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    height: spacing.touchTarget,
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
  },
});
