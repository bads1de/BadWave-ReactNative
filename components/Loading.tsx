import React, { memo } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";

interface LoadingProps {
  size?: "small" | "large" | number;
  color?: string;
}

function Loading({ size, color = "#4c1d95" }: LoadingProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={color} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});

// メモ化してエクスポート
export default memo(Loading);
