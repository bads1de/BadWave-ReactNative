import React, { useState } from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Alert,
  TextInput,
  StyleSheet,
  Modal,
} from "react-native";
import {
  GoogleSignin,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { AntDesign } from "@expo/vector-icons";
import { CACHED_QUERIES } from "@/constants";

GoogleSignin.configure({
  webClientId:
    "412901923265-4rek27if7dg41i3pl5ap0idho61th752.apps.googleusercontent.com",
});

export default function AuthModal() {
  const { session } = useAuth();
  const { setShowAuthModal } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const signInWithEmail = async () => {
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

      // レコメンデーションのキャッシュを無効化
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.getRecommendations],
      });
      setShowAuthModal(false);
    } catch (error: any) {
      Alert.alert("エラー", error.message);
    } finally {
      setLoading(false);
    }
  };

  const signUpWithEmail = async () => {
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
  };

  const signInWithGoogle = async () => {
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

      // レコメンデーションのキャッシュを無効化
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.getRecommendations],
      });

      // 成功時にモーダルを閉じる
      setShowAuthModal(false);
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // ユーザーがログインをキャンセル
        console.log("Sign in cancelled");
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // 処理が既に実行中
        Alert.alert("エラー", "ログイン処理が既に実行中です");
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        // Play Servicesが利用できない
        Alert.alert("エラー", "Google Play Servicesが利用できません");
      } else {
        // その他のエラー
        Alert.alert("エラー", error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      queryClient.resetQueries();
    } catch (error: any) {
      Alert.alert("エラー", error.message);
    }
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <LinearGradient
          colors={["rgba(76, 29, 149, 0.95)", "rgba(17, 24, 39, 0.95)"]}
          style={styles.modalContainer}
        >
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowAuthModal(false)}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>

          {session ? (
            <View style={styles.content}>
              <View style={styles.userInfo}>
                <Text style={styles.welcomeText}>ようこそ</Text>
                <Text style={styles.emailText}>{session.user.email}</Text>
              </View>
              <TouchableOpacity
                style={[styles.button, styles.logoutButton]}
                onPress={signOut}
              >
                <Text style={styles.buttonText}>ログアウト</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.content}>
              <Text style={styles.title}>BadWave</Text>
              <Text style={styles.subtitle}>音楽を共有しよう</Text>

              <TouchableOpacity
                style={styles.googleButton}
                onPress={signInWithGoogle}
              >
                <AntDesign
                  name="google"
                  size={24}
                  color="#4285F4"
                  style={styles.googleIcon}
                />
                <Text style={styles.googleButtonText}>Googleでログイン</Text>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>または</Text>
                <View style={styles.dividerLine} />
              </View>

              <TextInput
                style={styles.input}
                placeholder="メールアドレス"
                placeholderTextColor="#9CA3AF"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="パスワード"
                placeholderTextColor="#9CA3AF"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />

              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={signInWithEmail}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "読み込み中..." : "ログイン"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={signUpWithEmail}
                disabled={loading}
              >
                <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                  {loading ? "読み込み中..." : "新規登録"}
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
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#9CA3AF",
  },
  content: {
    gap: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#9CA3AF",
    textAlign: "center",
    marginBottom: 24,
  },
  input: {
    height: 50,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: "#4C1D95",
  },
  secondaryButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#4C1D95",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButtonText: {
    color: "#4C1D95",
  },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    height: 50,
    borderRadius: 12,
    marginBottom: 16,
  },
  googleIcon: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  googleButtonText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  dividerText: {
    color: "#9CA3AF",
    paddingHorizontal: 16,
  },
  userInfo: {
    alignItems: "center",
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 8,
  },
  emailText: {
    fontSize: 16,
    color: "#9CA3AF",
  },
  logoutButton: {
    backgroundColor: "#DC2626",
  },
});
