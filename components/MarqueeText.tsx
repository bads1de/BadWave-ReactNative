import { View, Text, StyleSheet } from "react-native";
import React, { memo } from "react";

function MarqueeText() {
  return (
    <View>
      <Text>MarqueeText</Text>
    </View>
  );
}

const styles = StyleSheet.create({});

// メモ化してエクスポート
export default memo(MarqueeText);
