import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Image } from "expo-image";
import { useAuthStore } from "@/hooks/useAuthStore";
import { useAuth } from "@/providers/AuthProvider";
import { useUser } from "@/actions/getUser";

export default function Header() {
  const { setShowAuthModal } = useAuthStore();
  const { data: user } = useUser();
  const { session } = useAuth();

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/images/logo.png")}
        style={styles.logo}
      />
      <Text style={styles.title}>BadWave</Text>
      {session ? (
        <TouchableOpacity
          onPress={() => setShowAuthModal(true)}
          style={styles.userIcon}
        >
          <Image source={{ uri: user?.avatar_url! }} style={styles.userIcon} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={() => setShowAuthModal(true)}
          style={styles.loginButton}
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
    backgroundColor: "#000",
  },
  logo: {
    width: 40,
    height: 40,
    resizeMode: "contain",
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  userIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    resizeMode: "cover",
    overflow: "hidden",
  },
  loginButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: "#4c4c4c",
    borderRadius: 5,
  },
  loginText: {
    color: "#fff",
    fontSize: 15,
  },
});
