import React, { useEffect, useRef } from 'react';
import { Animated, View, ViewStyle } from 'react-native';
import { useTheme } from '@react-navigation/native';
import { getColors } from '@/constants/theme';

interface SkeletonLineProps {
  width: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLine({ width, height = 14, borderRadius, style }: SkeletonLineProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const theme = useTheme();
  const C = getColors(theme.dark);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius: borderRadius ?? height / 2,
          backgroundColor: C.surfaceSecondary,
          opacity,
        },
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: ViewStyle }) {
  const theme = useTheme();
  const C = getColors(theme.dark);
  return (
    <View
      style={[
        {
          backgroundColor: C.surface,
          borderRadius: 16,
          padding: 16,
          borderWidth: 1,
          borderColor: C.border,
          gap: 10,
        },
        style,
      ]}
    >
      <SkeletonLine width="60%" height={16} />
      <SkeletonLine width="90%" height={12} />
      <SkeletonLine width="75%" height={12} />
    </View>
  );
}
