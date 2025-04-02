import React, { memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ErrorProps {
  message?: string;
}

function Error({ message }: ErrorProps) {
  return (
    <View style={styles.container}>
      <Ionicons name="alert-circle" size={24} color="#ef4444" />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  text: {
    color: "#fff",
    fontSize: 16,
    marginTop: 8,
  },
});

// メモ化してエクスポート
export default memo(Error);
