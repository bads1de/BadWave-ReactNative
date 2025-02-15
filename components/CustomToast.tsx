import React from "react";
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
    <BlurView intensity={30} style={styles.container} tint="dark">
      <LinearGradient
        colors={GRADIENTS.pinkBlue}
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
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
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

export const ToastComponent = () => (
  <Toast
    config={ToastConfig}
    position="bottom"
    autoHide={true}
    visibilityTime={3000}
    bottomOffset={80}
  />
);
