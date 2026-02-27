import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useAuthStore } from "@/hooks/stores/useAuthStore";
import { useAuth } from "@/providers/AuthProvider";
import { useUser } from "@/actions/user/getUser";
import { memo } from "react";

import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";

function Header() {
  const router = useRouter();
  const setShowAuthModal = useAuthStore((state) => state.setShowAuthModal);
  const { data: user } = useUser();
  const { session } = useAuth();
  const { colors } = useThemeStore();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
      <View style={styles.leftContainer}>
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={[styles.title, { color: colors.text }]}>BadWave</Text>
      </View>
      {session ? (
        <TouchableOpacity
          onPress={() => router.push("/account" as any)}
          style={[styles.userIconContainer, { borderColor: colors.primary }]}
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
          style={[styles.loginButton, { borderColor: colors.primary }]}
        >
          <Text style={[styles.loginText, { color: colors.primary }]}>LOG_IN</Text>
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
    paddingTop: 54, // Deeper padding for luxury feel
    paddingBottom: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 0.5,
  },
  leftContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 28,
    height: 28,
    marginRight: 12,
    opacity: 0.9,
  },
  title: {
    fontSize: 22,
    fontFamily: FONTS.title, // Bodoni Moda
    letterSpacing: 1,
  },
  userIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    padding: 2,
  },
  userIcon: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
  loginButton: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 2, // Minimalist square-ish
    borderWidth: 1,
  },
  loginText: {
    fontSize: 11,
    fontFamily: FONTS.body,
    letterSpacing: 2,
  },
});

export default memo(Header);

// メモ化してエクスポート
export default memo(Header);

// メモ化してエクスポート
export default memo(Header);

