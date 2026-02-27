import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";

interface SettingSectionProps {
  title?: string;
  icon?: React.ElementType;
  children: React.ReactNode;
}

export const SettingSection = ({
  title,
  icon: IconComponent,
  children,
}: SettingSectionProps) => {
  const { colors } = useThemeStore();

  return (
    <View style={styles.container}>
      {title && (
        <View style={styles.sectionTitleContainer}>
          <View style={styles.titleRow}>
            {IconComponent && (
              <IconComponent
                size={18}
                color={colors.primary}
                strokeWidth={1.5}
              />
            )}
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              {title}
            </Text>
          </View>
          <View
            style={[styles.titleSeparator, { backgroundColor: colors.border }]}
          />
        </View>
      )}
      <View
        style={[
          styles.cardContainer,
          { borderColor: "rgba(255, 255, 255, 0.12)" },
        ]}
      >
        <View
          style={[
            styles.backgroundFallback,
            { backgroundColor: "rgba(20, 20, 20, 0.4)" }, // matching library tab background
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
  sectionTitleContainer: {
    marginBottom: 20,
    marginTop: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: FONTS.title,
    letterSpacing: 0.5,
  },
  titleSeparator: {
    height: 1,
    width: "100%",
    opacity: 0.5,
  },
  cardContainer: {
    borderRadius: 24, // softer radius like emptyGlass
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)", // glass border
    position: "relative",
  },
  backgroundFallback: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    // Content sits on top of blur
  },
});
