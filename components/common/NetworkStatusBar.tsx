import React from "react";
import { View, Text, StyleSheet, Animated } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSync } from "@/providers/SyncProvider";
import { useEffect, useRef } from "react";

/**
 * ネットワーク状態と同期状態を表示するバー
 * オフライン時は赤いバー、同期中は青いバーを表示
 */
export function NetworkStatusBar() {
  const { isOnline } = useNetworkStatus();
  const { isSyncing } = useSync();
  const slideAnim = useRef(new Animated.Value(-50)).current;

  // オフラインまたは同期中の場合にバーを表示
  const shouldShow = !isOnline || isSyncing;

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: shouldShow ? 0 : -50,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [shouldShow, slideAnim]);

  if (!shouldShow) return null;

  const backgroundColor = !isOnline ? "#EF4444" : "#3B82F6";
  const message = !isOnline ? "オフラインです" : "同期中...";
  const icon = !isOnline ? "cloud-offline" : "sync";

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Ionicons name={icon as any} size={16} color="#fff" />
      <Text style={styles.text}>{message}</Text>
      {isSyncing && <View style={styles.loadingDot} />}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    zIndex: 1000,
  },
  text: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
    opacity: 0.7,
  },
});

export default NetworkStatusBar;
