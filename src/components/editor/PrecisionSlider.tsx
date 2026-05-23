import { useCallback, useRef, useState } from 'react';
import { View, StyleSheet, TextInput, Pressable, Keyboard } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors, spacing } from '../../theme';
import Text from '../Text';

interface PrecisionSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  bipolar?: boolean;
  defaultValue?: number;
  formatValue?: (v: number) => string;
  onValueChange: (value: number) => void;
  onSlidingStart?: () => void;
  onSlidingComplete?: (value: number) => void;
}

export default function PrecisionSlider({
  label,
  value,
  min,
  max,
  step = 1,
  bipolar = false,
  defaultValue,
  formatValue,
  onValueChange,
  onSlidingStart,
  onSlidingComplete,
}: PrecisionSliderProps) {
  const trackWidth = useSharedValue(0);
  const isActive = useSharedValue(false);
  const lastHapticValue = useRef<number | null>(null);
  const slidingStarted = useRef(false);
  const lastTapTime = useRef(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const range = max - min;
  const majorInterval = range <= 10 ? 1 : 25;
  const resetValue = defaultValue ?? (bipolar ? 0 : min);

  const triggerHaptic = useCallback((val: number) => {
    const rounded = Math.round(val / majorInterval) * majorInterval;
    if (rounded !== lastHapticValue.current && Math.abs(val - rounded) < step) {
      lastHapticValue.current = rounded;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [majorInterval, step]);

  const updateValue = useCallback((val: number) => {
    if (!slidingStarted.current) {
      slidingStarted.current = true;
      onSlidingStart?.();
    }
    onValueChange(val);
    triggerHaptic(val);
  }, [onValueChange, triggerHaptic, onSlidingStart]);

  const completeSlide = useCallback(() => {
    if (slidingStarted.current) {
      slidingStarted.current = false;
      onSlidingComplete?.(value);
    }
    lastHapticValue.current = null;
  }, [onSlidingComplete, value]);

  const handleReset = useCallback(() => {
    onSlidingStart?.();
    onValueChange(resetValue);
    onSlidingComplete?.(resetValue);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, [resetValue, onValueChange, onSlidingStart, onSlidingComplete]);

  // Double-tap detection via timestamps (called from worklet via runOnJS)
  const checkDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      lastTapTime.current = 0;
      handleReset();
    } else {
      lastTapTime.current = now;
    }
  }, [handleReset]);

  // Simple Pan gesture — all computation inline (no external function calls in worklet)
  const pan = Gesture.Pan()
    .onBegin(() => {
      isActive.value = true;
      runOnJS(checkDoubleTap)();
    })
    .onUpdate((e) => {
      const tw = trackWidth.value;
      if (tw <= 0) return;
      // Inline computation — safe in worklet (only uses captured primitives)
      const fraction = Math.max(0, Math.min(1, e.x / tw));
      const raw = min + fraction * (max - min);
      const stepped = Math.round(raw / step) * step;
      const clamped = Math.min(max, Math.max(min, stepped));
      runOnJS(updateValue)(clamped);
    })
    .onEnd(() => {
      isActive.value = false;
      runOnJS(completeSlide)();
    });

  // Position calculations
  const needlePosition = ((value - min) / range) * 100;
  const centerPosition = bipolar ? ((0 - min) / range) * 100 : 0;

  let fillLeft: number;
  let fillWidth: number;
  if (bipolar) {
    const start = Math.min(centerPosition, needlePosition);
    const end = Math.max(centerPosition, needlePosition);
    fillLeft = start;
    fillWidth = end - start;
  } else {
    fillLeft = 0;
    fillWidth = needlePosition;
  }

  const needleAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: isActive.value ? 1.6 : 1 }],
  }));

  const displayValue = formatValue
    ? formatValue(value)
    : value % 1 === 0 ? String(value) : value.toFixed(1);

  // Manual value entry
  const handleValueTap = () => {
    setEditText(String(value));
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const handleManualSubmit = () => {
    const parsed = parseFloat(editText);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      const stepped = Math.round(clamped / step) * step;
      onSlidingStart?.();
      onValueChange(stepped);
      onSlidingComplete?.(stepped);
    }
    setIsEditing(false);
    Keyboard.dismiss();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="labelSm" color="onSurface">{label}</Text>
        {isEditing ? (
          <TextInput
            ref={inputRef}
            style={styles.valueInput}
            value={editText}
            onChangeText={setEditText}
            onSubmitEditing={handleManualSubmit}
            onBlur={handleManualSubmit}
            keyboardType="numeric"
            selectTextOnFocus
            returnKeyType="done"
            maxLength={6}
          />
        ) : (
          <Pressable onPress={handleValueTap} hitSlop={8}>
            <Text variant="monoData" color="primary">{displayValue}</Text>
          </Pressable>
        )}
      </View>
      <GestureDetector gesture={pan}>
        <View
          style={styles.trackContainer}
          onLayout={(e) => { trackWidth.value = e.nativeEvent.layout.width; }}
        >
          <View style={styles.track}>
            {/* Filled track */}
            <View
              style={[
                styles.fill,
                { left: `${fillLeft}%`, width: `${Math.max(0, fillWidth)}%` },
              ]}
            />
            {/* Center mark for bipolar sliders */}
            {bipolar && (
              <View style={[styles.centerMark, { left: `${centerPosition}%` }]} />
            )}
            {/* Needle */}
            <Animated.View
              style={[
                styles.needle,
                { left: `${needlePosition}%` },
                needleAnimatedStyle,
              ]}
            />
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.unit,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.unit,
    minHeight: 28,
  },
  trackContainer: {
    height: spacing.touchTarget,
    justifyContent: 'center',
    paddingHorizontal: spacing.unit,
  },
  track: {
    height: 1,
    backgroundColor: colors.border,
    position: 'relative',
  },
  fill: {
    position: 'absolute',
    top: 0,
    height: 1,
    backgroundColor: colors.interactiveBlue,
  },
  centerMark: {
    position: 'absolute',
    top: '50%',
    marginTop: -6,
    width: 1,
    height: 12,
    backgroundColor: colors.secondaryContainer,
  },
  needle: {
    position: 'absolute',
    top: '50%',
    marginTop: -10,
    marginLeft: -1,
    width: 2,
    height: 20,
    backgroundColor: colors.interactiveBlue,
    borderRadius: 1,
  },
  valueInput: {
    color: colors.interactiveBlue,
    fontFamily: 'JetBrainsMono-Regular',
    fontSize: 10,
    lineHeight: 12,
    minWidth: 40,
    textAlign: 'right',
    padding: 0,
    margin: 0,
    borderBottomWidth: 1,
    borderBottomColor: colors.interactiveBlue,
  },
});
