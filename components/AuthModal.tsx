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
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { useAuthStore } from "@/hooks/useAuthStore";

// TODO: Googleログインを実装する
export default function AuthModal() {
  const { session } = useAuth();
  const { setShowAuthModal } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const signInWithEmail = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert(error.message);

    setLoading(false);
  };

  const signUpWithEmail = async () => {
    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert(error.message);
    } else {
      Alert.alert("確認メールを送信しました！");
    }

    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.backdrop}>
        <View style={styles.modalContainer}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => {
              setShowAuthModal(false);
            }}
          >
            <Text style={styles.closeButtonText}>×</Text>
          </TouchableOpacity>
          {session ? (
            <View style={styles.content}>
              <Text style={styles.loggedInText}>
                ログイン済み: {session.user.email}
              </Text>
              <TouchableOpacity style={styles.button} onPress={signOut}>
                <Text style={styles.buttonText}>ログアウト</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.content}>
              <TextInput
                style={styles.input}
                placeholder="メールアドレス"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="パスワード"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.button}
                onPress={signInWithEmail}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "読み込み中..." : "ログイン"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.button}
                onPress={signUpWithEmail}
                disabled={loading}
              >
                <Text style={styles.buttonText}>
                  {loading ? "読み込み中..." : "新規登録"}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "85%",
    backgroundColor: "rgba(23, 23, 23, 0.98)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#4c1d95",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    alignSelf: "flex-end",
    padding: 8,
  },
  closeButtonText: {
    fontSize: 28,
    color: "#666",
  },
  content: {
    marginTop: 16,
    gap: 16,
  },
  input: {
    height: 50,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4c1d95",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#4c1d95",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
  },
  loggedInText: {
    color: "#fff",
    marginBottom: 20,
    fontSize: 18,
    textAlign: "center",
  },
});
