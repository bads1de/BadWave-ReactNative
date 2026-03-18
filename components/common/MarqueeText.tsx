import { View, Text, StyleSheet, ViewStyle, TextStyle } from "react-native";
import React, { memo } from "react";
import { Marquee } from "@animatereactnative/marquee";

interface MarqueeTextProps {
  text: string;
  speed?: number;
  spacing?: number;
  style?: ViewStyle;
  withGesture?: boolean;
  fontSize?: number;
  fontFamily?: string;
  animate?: boolean;
}

function MarqueeText({
  text,
  speed = 1,
  spacing = 100,
  style,
  withGesture = false,
  fontSize = 16,
  fontFamily,
  animate = true,
}: MarqueeTextProps) {
  const textStyle: TextStyle = {
    fontSize,
    ...(fontFamily ? { fontFamily } : {}),
  };
  const shouldAnimate = animate && text.length > 15;

  return (
    <View style={[styles.container, style]} testID="marquee-text-container">
      {shouldAnimate ? (
        <Marquee speed={speed} spacing={spacing} withGesture={withGesture}>
          <Text style={[styles.text, textStyle]}>{text}</Text>
        </Marquee>
      ) : (
        <Text style={[styles.text, textStyle]}>{text}</Text>
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
    color: "#fff",
    fontWeight: "bold",
  },
});

// メモ化してエクスポート
export default memo(MarqueeText, (prevProps, nextProps) => {
  return (
    prevProps.text === nextProps.text &&
    prevProps.speed === nextProps.speed &&
    prevProps.spacing === nextProps.spacing &&
    prevProps.style === nextProps.style &&
    prevProps.withGesture === nextProps.withGesture &&
    prevProps.fontSize === nextProps.fontSize &&
    prevProps.fontFamily === nextProps.fontFamily &&
    prevProps.animate === nextProps.animate
  );
});
