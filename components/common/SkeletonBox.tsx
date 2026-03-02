import React, { memo, useEffect } from "react";
import { StyleSheet, ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from "react-native-reanimated";
import { useThemeStore } from "@/hooks/stores/useThemeStore";

interface SkeletonBoxProps {
  width?: number | `${number}%`;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
  testID?: string;
}

/**
 * シマーアニメーション付きスケルトンプレースホルダー
 * react-native-reanimated を使用しているため JS スレッドをブロックしない
 */
function SkeletonBox({
  width = "100%",
  height,
  borderRadius = 8,
  style,
  testID,
}: SkeletonBoxProps) {
  const shimmer = useSharedValue(0);
  const colors = useThemeStore((state) => state.colors);

  useEffect(() => {
    shimmer.value = withRepeat(
      withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true, // reverse: true → 行きと帰りでアニメーション
    );
  }, [shimmer]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 1], [0.35, 0.7]),
  }));

  return (
    <Animated.View
      testID={testID ?? "skeleton-box"}
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: colors.card,
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export default memo(SkeletonBox);
