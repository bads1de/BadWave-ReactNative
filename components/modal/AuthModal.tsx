import React, { useState, useCallback, memo } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Alert,
  TextInput,
  StyleSheet,
  Modal,
  ActivityIndicator,
} from "react-native";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useAuthStore } from "@/hooks/stores/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { Chrome, Mail, Lock, LogOut, X } from "lucide-react-native";
import { CACHED_QUERIES } from "@/constants";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";
import * as Haptics from "expo-haptics";

GoogleSignin.configure({
  webClientId:
    "412901923265-4rek27if7dg41i3pl5ap0idho61th752.apps.googleusercontent.com",
});

function AuthModalInner() {
  const { session } = useAuth();
  const setShowAuthModal = useAuthStore((state) => state.setShowAuthModal);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const colors = useThemeStore((state) => state.colors);

  const signInWithEmail = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!email || !password) {
      Alert.alert("エラー", "メールアドレスとパスワードを入力してください");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.getRecommendations],
      });
      setShowAuthModal(false);
    } catch (error: any) {
      Alert.alert("エラー", error.message);
    } finally {
      setLoading(false);
    }
  }, [email, password, queryClient, setShowAuthModal]);

  const signUpWithEmail = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!email || !password) {
      Alert.alert("エラー", "メールアドレスとパスワードを入力してください");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      Alert.alert("成功", "確認メールを送信しました！");
    } catch (error: any) {
      Alert.alert("エラー", error.message);
    } finally {
      setLoading(false);
    }
  }, [email, password]);

  const signInWithGoogle = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setLoading(true);

    try {
      await GoogleSignin.hasPlayServices();
      const userInfo = await GoogleSignin.signIn();

      const { error, data } = await supabase.auth.signInWithIdToken({
        provider: "google",
        token: userInfo?.data?.idToken ?? "",
      });

      if (!data.user) {
        Alert.alert("エラー", "Googleログインに失敗しました");
        return;
      }

      if (error) throw error;

      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.getRecommendations],
      });

      setShowAuthModal(false);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log("Sign in cancelled");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        Alert.alert("エラー", "ログイン処理が既に実行中です");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert("エラー", "Google Play Servicesが利用できません");
      } else {
        Alert.alert("エラー", error.message);
      }
    } finally {
      setLoading(false);
    }
  }, [queryClient, setShowAuthModal]);

  const signOut = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      queryClient.resetQueries();
      setShowAuthModal(false);
    } catch (error: any) {
      Alert.alert("エラー", error.message);
    }
  }, [queryClient, setShowAuthModal]);

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <LinearGradient
          colors={[colors.card, colors.background]}
          style={[styles.modalContainer, { borderColor: colors.border }]}
        >
          <TouchableOpacity
            style={[styles.closeIconButton, { backgroundColor: colors.background + "80" }]}
            onPress={() => setShowAuthModal(false)}
          >
            <X size={20} color={colors.text} strokeWidth={1.5} />
          </TouchableOpacity>

          {session ? (
            <View style={styles.content}>
              <View style={styles.userInfo}>
                <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.avatarInitial, { color: colors.primary }]}>
                    {session.user.email?.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={[styles.welcomeText, { color: colors.text }]}>おかえりなさい</Text>
                <Text style={[styles.emailText, { color: colors.subText }]}>{session.user.email}</Text>
              </View>
              
              <TouchableOpacity
                style={[styles.button, styles.logoutButton]}
                onPress={signOut}
              >
                <LogOut size={20} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>ログアウト</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.content}>
              <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>BadWave</Text>
                <Text style={[styles.subtitle, { color: colors.subText }]}>音楽体験を、もっと身近に</Text>
              </View>

              <TouchableOpacity
                style={[styles.googleButton, { backgroundColor: "#fff" }]}
                onPress={signInWithGoogle}
                disabled={loading}
              >
                <Chrome size={22} color="#4285F4" strokeWidth={2.5} style={styles.googleIcon} />
                <Text style={styles.googleButtonText}>Googleでログイン</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerText, { color: colors.subText }]}>または</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              <View style={styles.inputContainer}>
                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Mail size={18} color={colors.subText} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="メールアドレス"
                    placeholderTextColor={colors.subText + "80"}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    selectionColor={colors.primary}
                  />
                </View>

                <View style={[styles.inputWrapper, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <Lock size={18} color={colors.subText} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="パスワード"
                    placeholderTextColor={colors.subText + "80"}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    selectionColor={colors.primary}
                  />
                </View>
              </View>

              <TouchableOpacity
                style={[styles.button, { backgroundColor: colors.primary }, loading && styles.disabledButton]}
                onPress={signInWithEmail}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={colors.primaryDark} />
                ) : (
                  <Text style={[styles.buttonText, { color: colors.primaryDark }]}>ログイン</Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.primary }]}
                onPress={signUpWithEmail}
                disabled={loading}
              >
                <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>
                  アカウントをお持ちでない方はこちら
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </LinearGradient>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 32,
    padding: 28,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 24,
  },
  closeIconButton: {
    alignSelf: "flex-end",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },
  content: {
    gap: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 40,
    fontFamily: FONTS.title,
    letterSpacing: -1,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: FONTS.body,
    opacity: 0.8,
  },
  inputContainer: {
    gap: 12,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  inputIcon: {
    marginRight: 12,
    opacity: 0.7,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    fontFamily: FONTS.body,
  },
  button: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },
  disabledButton: {
    opacity: 0.7,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: "center",
  },
  secondaryButtonText: {
    fontSize: 13,
    fontFamily: FONTS.semibold,
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 56,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  googleIcon: {
    marginRight: 12,
  },
  googleButtonText: {
    color: "#1F2937",
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 8,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    opacity: 0.3,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 12,
    fontFamily: FONTS.body,
    opacity: 0.6,
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  avatarInitial: {
    fontSize: 32,
    fontFamily: FONTS.bold,
  },
  welcomeText: {
    fontSize: 24,
    fontFamily: FONTS.title,
    marginBottom: 4,
  },
  emailText: {
    fontSize: 14,
    fontFamily: FONTS.body,
  },
  logoutButton: {
    backgroundColor: "#EF4444",
  },
  buttonIcon: {
    marginRight: 4,
  },
});

export default memo(AuthModalInner);



