import React from "react";
import { View, StyleSheet } from "react-native";
import SubPlayer from "@/components/SubPlayer";
import { useSubPlayerStore } from "@/hooks/useSubPlayerStore";

export default function SubPlayerContainer() {
  const { showSubPlayer, setShowSubPlayer } = useSubPlayerStore();

  if (!showSubPlayer) return null;

  return (
    <View style={styles.container}>
      <SubPlayer onClose={() => setShowSubPlayer(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000, // PlayerContainerよりも前面に表示
  },
});
