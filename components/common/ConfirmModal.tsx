import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

interface ConfirmModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  isDestructive?: boolean;
}

const { width } = Dimensions.get("window");

export function ConfirmModal({
  visible,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  icon = "alert-circle",
  isDestructive = true,
}: ConfirmModalProps) {
  const [fadeAnim] = React.useState(new Animated.Value(0));
  const [scaleAnim] = React.useState(new Animated.Value(0.9));

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.9);
    }
  }, [visible, fadeAnim, scaleAnim]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none">
      <View style={styles.overlay}>
        <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]}>
          <TouchableOpacity
            activeOpacity={1}
            style={styles.fullScreen}
            onPress={onCancel}
          >
            <BlurView intensity={30} tint="dark" style={styles.fullScreen} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <View style={styles.content}>
            {/* Icon Decoration */}
            <View
              style={[
                styles.iconWrapper,
                isDestructive && styles.destructiveIconWrapper,
              ]}
            >
              <LinearGradient
                colors={
                  isDestructive
                    ? ["#ff4b2b", "#ff416c"]
                    : ["#8e2de2", "#4a00e0"]
                }
                style={styles.iconGradient}
              >
                <Ionicons name={icon} size={40} color="#fff" />
              </LinearGradient>
            </View>

            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>

            <View style={styles.buttonStack}>
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={onConfirm}
                style={styles.confirmButton}
                testID="modal-confirm-button"
              >
                <LinearGradient
                  colors={
                    isDestructive
                      ? ["#ff416c", "#ff4b2b"]
                      : ["#4a00e0", "#8e2de2"]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.confirmText}>{confirmLabel}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.7}
                onPress={onCancel}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelText}>{cancelLabel}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
  },
  fullScreen: {
    flex: 1,
  },
  container: {
    width: width * 0.85,
    maxWidth: 400,
    backgroundColor: "#1c1c1e",
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 20,
    overflow: "hidden",
  },
  content: {
    padding: 32,
    alignItems: "center",
  },
  iconWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    padding: 4,
    backgroundColor: "rgba(74, 0, 224, 0.1)",
    marginBottom: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  destructiveIconWrapper: {
    backgroundColor: "rgba(255, 65, 108, 0.1)",
  },
  iconGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: "800",
    color: "#fff",
    marginBottom: 12,
    textAlign: "center",
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  buttonStack: {
    width: "100%",
    gap: 12,
  },
  confirmButton: {
    width: "100%",
    height: 56,
    borderRadius: 18,
    overflow: "hidden",
  },
  gradientButton: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  confirmText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  cancelButton: {
    width: "100%",
    height: 56,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  cancelText: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    fontWeight: "600",
  },
});
