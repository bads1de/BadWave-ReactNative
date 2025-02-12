import { View, Text } from "react-native";
import getSongs from "@/actions/getSongs";

export default async function LibraryScreen() {
  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: "#000",
      }}
    >
      <Text style={{ color: "#fff" }}> ライブラリ</Text>
    </View>
  );
}
