import { View, Text, StyleSheet, ViewStyle } from "react-native";
import React, { memo } from "react";
import { Marquee } from "@animatereactnative/marquee";

interface MarqueeTextProps {
  text: string;
  speed?: number;
  spacing?: number;
  style?: ViewStyle;
  withGesture?: boolean;
  fontSize?: number;
}

function MarqueeText({
  text,
  speed = 1,
  spacing = 100,
  style,
  withGesture = false,
  fontSize = 16,
}: MarqueeTextProps) {
  return (
    <View style={[styles.container, style]} testID="marquee-text-container">
      {text.length > 15 ? (
        <Marquee speed={speed} spacing={spacing} withGesture={withGesture}>
          <Text style={[styles.text, { fontSize }]}>{text}</Text>
        </Marquee>
      ) : (
        <Text style={[styles.text, { fontSize }]}>{text}</Text>
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
  // すべてのpropsを比較
  return (
    prevProps.text === nextProps.text &&
    prevProps.speed === nextProps.speed &&
    prevProps.spacing === nextProps.spacing &&
    prevProps.style === nextProps.style && // styleオブジェクトの参照を比較
    prevProps.withGesture === nextProps.withGesture &&
    prevProps.fontSize === nextProps.fontSize
  );
});

