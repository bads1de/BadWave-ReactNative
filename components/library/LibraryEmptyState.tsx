import React, { memo, ReactNode } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";

interface LibraryEmptyStateProps {
  icon: ReactNode;
  title: string;
  subtitle: string;
}

function LibraryEmptyStateInner({
  icon,
  title,
  subtitle,
}: LibraryEmptyStateProps) {
  const colors = useThemeStore((state) => state.colors);

  return (
    <Animated.View entering={FadeIn.delay(200)} style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: "rgba(255, 255, 255, 0.02)",
            borderColor: "rgba(255, 255, 255, 0.05)",
          },
        ]}
      >
        {icon}
        <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.subText }]}>
          {subtitle}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  card: {
    borderRadius: 32,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderStyle: "dashed",
  },
  title: {
    fontSize: 24,
    fontFamily: FONTS.title,
    marginTop: 20,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    fontFamily: FONTS.body,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});

export const LibraryEmptyState = memo(LibraryEmptyStateInner);

