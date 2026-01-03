import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/**
 * @file (tabs)/account.tsx
 * @description アカウントページ
 *
 * ユーザーのアカウント情報や設定を表示するページです。
 * タブナビゲーションの一部として定義されますが、タブバーには表示されません（href: null）。
 * これにより、PlayerContainer（ミニプレイヤー）が表示された状態で遷移できます。
 */
export default function AccountScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* ヘッダー */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          testID="back-button"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>アカウント</Text>
        <View style={styles.placeholder} />
      </View>

      {/* コンテンツ（空） */}
      <View style={styles.content}>
        <Text style={styles.emptyText}>Coming Soon...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 30,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#222",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
  },
});
