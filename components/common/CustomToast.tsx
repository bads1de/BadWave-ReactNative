import React, { memo } from "react";
import { StyleSheet, Text } from "react-native";
import Toast, { BaseToastProps } from "react-native-toast-message";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, GRADIENTS } from "@/constants/theme";

const ToastConfig = {
  success: (props: BaseToastProps) => (
    <BlurView intensity={30} style={styles.container} tint="dark">
      <LinearGradient
        colors={GRADIENTS.success}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="checkmark-circle" size={24} color={COLORS.text} />
        <Text style={styles.text}>{props.text1}</Text>
      </LinearGradient>
    </BlurView>
  ),

  error: (props: BaseToastProps) => (
    <BlurView intensity={30} style={styles.container} tint="dark">
      <LinearGradient
        colors={GRADIENTS.error}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="alert-circle" size={24} color={COLORS.text} />
        <Text style={styles.text}>{props.text1}</Text>
      </LinearGradient>
    </BlurView>
  ),

  info: (props: BaseToastProps) => (
    <BlurView
      intensity={30}
      style={[styles.container, { backgroundColor: "rgba(76,29,149,0.3)" }]}
      tint="dark"
    >
      <LinearGradient
        colors={["#4c1d95", "#6d28d9"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Ionicons name="information-circle" size={24} color={COLORS.text} />
        <Text style={styles.text}>{props.text1}</Text>
      </LinearGradient>
    </BlurView>
  ),
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: "hidden",
    marginHorizontal: 20,
    marginBottom: 40,
    shadowColor: "#4c1d95",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
    borderWidth: 1,
    borderColor: "rgba(76,29,149,0.5)",
  },
  gradient: {
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  text: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "600",
    flexShrink: 1,
  },
});

// メモ化してエクスポート
export const ToastComponent = memo(() => (
  <Toast
    config={ToastConfig}
    position="top"
    autoHide={true}
    visibilityTime={3000}
    bottomOffset={80}
  />
));

ToastComponent.displayName = "ToastComponent";
