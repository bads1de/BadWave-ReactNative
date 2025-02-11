import React, { useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  Image,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { songs } from "../../data/songs";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "../../hooks/useAudioPlayer";
import { usePlayerStore } from "../../hooks/usePlayerStore";
import SpotlightBoard from "@/components/SpotlightBoard";

export default function HomeScreen() {
  const { currentSong, showPlayer } = usePlayerStore();
  const { togglePlayPause, isPlaying } = useAudioPlayer(songs);

  const renderItem = useCallback(
    ({ item }: any) => (
      <TouchableOpacity
        style={styles.songItem}
        onPress={async () => {
          await togglePlayPause(item);
        }}
      >
        <Image source={item.image_path} style={styles.image} />
        <View style={styles.songInfo}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.author}>{item.author}</Text>
        </View>
        <TouchableOpacity
          onPress={async (e) => {
            e.stopPropagation();
            await togglePlayPause(item);
          }}
        >
          <Ionicons
            name={
              currentSong?.id === item.id && isPlaying
                ? "pause-circle"
                : "play-circle"
            }
            size={40}
            color="#fff"
          />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [currentSong, isPlaying, togglePlayPause]
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.listWrapper}>
        <SpotlightBoard />
        <FlatList
          data={songs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContainer,
            currentSong && !showPlayer && { paddingBottom: 130 },
          ]}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  listWrapper: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingTop: 220,
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#111",
    marginBottom: 10,
    borderRadius: 8,
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  songInfo: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  author: {
    color: "#999",
    fontSize: 14,
  },
});
