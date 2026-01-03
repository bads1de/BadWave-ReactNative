import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/hooks/stores/useAuthStore";
import { useAuth } from "@/providers/AuthProvider";
import { useUser } from "@/actions/getUser";
import { memo } from "react";

import { useThemeStore } from "@/hooks/stores/useThemeStore";

function Header() {
  const router = useRouter();
  const setShowAuthModal = useAuthStore((state) => state.setShowAuthModal);
  const { data: user } = useUser();
  const { session } = useAuth();
  const { colors } = useThemeStore();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Image
        source={require("@/assets/images/logo.png")}
        style={styles.logo}
        contentFit="contain"
      />
      <Text style={[styles.title, { color: colors.text }]}>BadWave</Text>
      {session ? (
        <TouchableOpacity
          onPress={() => router.push("/account" as any)}
          style={styles.userIcon}
          testID="user-icon-button"
        >
          <Image
            source={{ uri: user?.avatar_url! }}
            style={styles.userIcon}
            contentFit="cover"
          />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => setShowAuthModal(true)}
          style={[styles.loginButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 30,
    paddingHorizontal: 15,
  },
  logo: {
    width: 40,
    height: 40,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
  },
  loginButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  loginText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
  },
});

// メモ化してエクスポート
export default memo(Header);
