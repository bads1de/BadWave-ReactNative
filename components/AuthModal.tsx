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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
  },
  closeButton: {
    alignSelf: "flex-end",
  },
  closeButtonText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#000",
  },
  content: {
    marginTop: 10,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 15,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  button: {
    backgroundColor: "#22c55e",
    padding: 15,
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
  },
  loggedInText: {
    color: "#000",
    marginBottom: 15,
    fontSize: 16,
    textAlign: "center",
  },
});
