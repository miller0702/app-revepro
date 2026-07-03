import { useEffect } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '../../hooks/useTheme';
import { radius } from '../../theme/tokens';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  fill?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius = radius.sm,
  fill = false,
  style,
}: SkeletonProps) {
  const { colors, isDark } = useTheme();
  const baseColor = isDark ? 'rgba(255,255,255,0.1)' : colors.border;
  const boxStyle = fill
    ? { ...StyleSheet.absoluteFillObject, borderRadius, backgroundColor: baseColor }
    : { width, height, borderRadius, backgroundColor: baseColor };

  if (Platform.OS === 'ios') {
    return <View style={[boxStyle, { opacity: 0.72 }, style]} />;
  }

  return <SkeletonPulse boxStyle={boxStyle} style={style} />;
}

function SkeletonPulse({
  boxStyle,
  style,
}: {
  boxStyle: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
}) {
  const pulse = useSharedValue(0.55);

  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 850 }), -1, true);
    return () => {
      cancelAnimation(pulse);
    };
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: pulse.value,
  }));

  return <Animated.View style={[boxStyle, animatedStyle, style]} />;
}
