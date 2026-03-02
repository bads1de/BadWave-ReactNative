import React, { memo } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useThemeStore } from "@/hooks/stores/useThemeStore";

interface LoadingProps {
  size?: "small" | "large" | number;
  color?: string;
  testID?: string;
}

/**
 * 画面中央にローディングインジケーターを表示するコンポーネントです。
 *
 * @param {LoadingProps} props - コンポーネントのプロパティ。
 * @param {'small' | 'large' | number} [props.size='large'] - インジケーターのサイズ。
 * @param {string} [props.color='#4c1d95'] - インジケーターの色。
/**
 * 画面中央にローディングインジケーターを表示するコンポーネントです。
 *
 * @param {LoadingProps} props - コンポーネントのプロパティ。
 * @param {'small' | 'large' | number} [props.size='large'] - インジケーターのサイズ。
 * @param {string} [props.color='#4c1d95'] - インジケーターの色。
 * @param {string} [props.testID] - テスト用のID。
 * @returns {JSX.Element} ローディングインジケーターコンポーネント。
 */
function Loading({ size, color, testID }: LoadingProps) {
  const colors = useThemeStore((state) => state.colors);
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

