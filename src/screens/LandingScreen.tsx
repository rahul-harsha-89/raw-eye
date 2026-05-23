import { View, Pressable, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { colors, spacing } from '../theme';
import Text from '../components/Text';
import type { RootStackParamList } from '../navigation/RootNavigator';

type LandingNav = StackNavigationProp<RootStackParamList, 'Landing'>;

export default function LandingScreen() {
  const navigation = useNavigation<LandingNav>();
  const heroOpacity = useSharedValue(0);
  const ctaOpacity = useSharedValue(0);

  useEffect(() => {
    heroOpacity.value = withTiming(1, { duration: 500 });
    ctaOpacity.value = withDelay(300, withTiming(1, { duration: 500 }));
  }, []);

  const heroStyle = useAnimatedStyle(() => ({ opacity: heroOpacity.value }));
  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaOpacity.value }));

  return (
    <View style={styles.container}>
      {/* Hero section */}
      <Animated.View style={[styles.hero, heroStyle]}>
        <MaterialIcons name="camera" size={56} color={colors.primary} />
        <Text variant="displaySm" color="onSurface" style={styles.headline}>
          YOUR DARKROOM,{'\n'}ANYWHERE
        </Text>
        <Text variant="bodyMd" color="onSurfaceVariant" style={styles.subtitle}>
          Professional-grade RAW editing with AI-powered style transfer. Fully offline. Built for photographers.
        </Text>
      </Animated.View>

      {/* Feature highlights */}
      <Animated.View style={[styles.features, ctaStyle]}>
        <FeatureRow icon="tune" text="Non-destructive precision editing" />
        <FeatureRow icon="auto-awesome" text="On-device AI style transfer" />
        <FeatureRow icon="offline-bolt" text="100% offline processing" />
      </Animated.View>

      {/* CTA buttons */}
      <Animated.View style={[styles.ctaContainer, ctaStyle]}>
        <Pressable
          onPress={() => navigation.replace('Home')}
          style={styles.primaryBtn}
        >
          <Text variant="labelCaps" style={{ color: colors.onPrimary }}>
            GET STARTED
          </Text>
        </Pressable>
        <Text variant="monoData" color="outline" style={styles.version}>
          RAW EYE v1.0 // OFFLINE ENGINE
        </Text>
      </Animated.View>
    </View>
  );
}

function FeatureRow({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureRow}>
      <MaterialIcons name={icon as any} size={20} color={colors.interactiveBlue} />
      <Text variant="labelSm" color="onSurfaceVariant">{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.edgeMargin,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 48,
  },
  hero: {
    alignItems: 'center',
    gap: spacing.gutter,
  },
  headline: {
    textAlign: 'center',
    marginTop: spacing.gutter,
  },
  subtitle: {
    textAlign: 'center',
    paddingHorizontal: 24,
    marginTop: 4,
  },
  features: {
    gap: 16,
    paddingHorizontal: 8,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.gutter,
  },
  ctaContainer: {
    alignItems: 'center',
    gap: spacing.gutter,
  },
  primaryBtn: {
    width: '100%',
    height: spacing.touchTarget,
    backgroundColor: colors.primaryContainer,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  version: {
    marginTop: 4,
  },
});
