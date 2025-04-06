import { View, Text, StyleSheet, ViewStyle } from "react-native";
import React, { memo } from "react";
import { Marquee } from "@animatereactnative/marquee";

interface MarqueeTextProps {
  text: string;
  speed?: number;
  spacing?: number;
  style?: ViewStyle;
  withGesture?: boolean;
}

function MarqueeText({
  text,
  speed = 1,
  spacing = 100,
  style,
  withGesture = false,
}: MarqueeTextProps) {
  return (
    <View style={[styles.container, style]} testID="marquee-text-container">
      {text.length > 15 ? (
        <Marquee speed={speed} spacing={spacing} withGesture={withGesture}>
          <Text style={styles.text}>{text}</Text>
        </Marquee>
      ) : (
        <Text style={styles.text}>{text}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    overflow: "hidden",
  },
  text: {
    fontSize: 16,
    color: "#fff",
  },
});

// メモ化してエクスポート
export default memo(MarqueeText);
