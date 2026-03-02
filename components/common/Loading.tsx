import React, { memo } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import HomeSkeleton from "@/components/common/HomeSkeleton";

export type LoadingVariant = "spinner" | "home";

interface LoadingProps {
  size?: "small" | "large" | number;
  color?: string;
  testID?: string;
  /** ローディング演出の種類。'spinner'（デフォルト）か 'home' スケルトン */
  variant?: LoadingVariant;
}

/**
 * ローディングコンポーネント。
 * variant="spinner"（デフォルト）: ぐるぐるインジケーター
 * variant="home":                 ホーム画面に近いスケルトンレイアウト
 *
 * @param {string} [props.testID] - テスト用のID。
 */
function Loading({ size, color, testID, variant = "spinner" }: LoadingProps) {
  const colors = useThemeStore((state) => state.colors);

  if (variant === "home") {
    return <HomeSkeleton />;
  }

  const indicatorColor = color || colors.primary;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      testID={testID || "loading-container"}
    >
      <ActivityIndicator
        size={size}
        color={indicatorColor}
        testID="loading-indicator"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default memo(Loading);
