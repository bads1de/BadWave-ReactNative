import React from "react";
import { ScrollView, Text, StyleSheet } from "react-native";

interface LyricProps {
  lyrics: string;
}

const Lyric: React.FC<LyricProps> = ({ lyrics }) => {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.lyricsText}>{lyrics}</Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "#000",
    padding: 16,
  },
  lyricsText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    textShadowColor: "#fff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});

export default Lyric;
