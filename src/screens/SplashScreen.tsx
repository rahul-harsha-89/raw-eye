import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { MaterialIcons } from '@expo/vector-icons';
import { colors, spacing } from '../theme';
import Text from '../components/Text';
import type { RootStackParamList } from '../navigation/RootNavigator';
import { isFirstLaunch } from '../utils/firstLaunch';

type SplashNav = StackNavigationProp<RootStackParamList, 'Splash'>;

export default function SplashScreen() {
  const navigation = useNavigation<SplashNav>();
  const opacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 600 });
    textOpacity.value = withDelay(400, withTiming(1, { duration: 600 }));

    const timer = setTimeout(async () => {
      const first = await isFirstLaunch();
      if (first) {
        navigation.replace('Landing');
      } else {
        navigation.replace('Home');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  const iconStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const textStyle = useAnimatedStyle(() => ({ opacity: textOpacity.value }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.center, iconStyle]}>
        <MaterialIcons name="camera" size={48} color={colors.primary} />
      </Animated.View>
      <Animated.View style={[styles.bottom, textStyle]}>
        <Text variant="monoData" color="outline">SYSTEM INITIALIZING</Text>
        <View style={styles.progressTrack}>
          <View style={styles.progressBar} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    gap: spacing.gutter,
  },
  bottom: {
    position: 'absolute',
    bottom: 60,
    alignItems: 'center',
    gap: spacing.gutter,
  },
  progressTrack: {
    width: 120,
    height: 2,
    backgroundColor: colors.border,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressBar: {
    width: '60%',
    height: '100%',
    backgroundColor: colors.interactiveBlue,
  },
});
