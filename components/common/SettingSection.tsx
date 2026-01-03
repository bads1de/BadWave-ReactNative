import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useThemeStore } from "@/hooks/stores/useThemeStore";

interface SettingSectionProps {
  title?: string;
  children: React.ReactNode;
}

export const SettingSection = ({ title, children }: SettingSectionProps) => {
  const { colors } = useThemeStore();

  return (
    <View style={styles.container}>
      {title && (
        <Text style={[styles.title, { color: colors.subText }]}>{title}</Text>
      )}
      <View style={[styles.cardContainer, { borderColor: colors.border }]}>
        <View
          style={[
            styles.backgroundFallback,
            { backgroundColor: colors.card, opacity: 0.7 },
          ]}
        />
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  cardContainer: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    position: "relative",
  },
  backgroundFallback: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    // Content sits on top of blur
  },
});
