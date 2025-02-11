import React, { useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from "react-native";
import { songs } from "@/data/songs";
import { Ionicons } from "@expo/vector-icons";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import SpotlightBoard from "@/components/SpotlightBoard";
import GenreCard from "@/components/GenreCard";
import { genreCards } from "@/constants";
import SongItem from "@/components/SongItem";

export default function HomeScreen() {
  const { currentSong, showPlayer } = usePlayerStore();
  const { togglePlayPause, isPlaying } = useAudioPlayer(songs);

  // const renderItem = useCallback(
  //   ({ item }: { item: any }) => (
  //     <TouchableOpacity
  //       style={styles.songItem}
  //       onPress={async () => {
  //         await togglePlayPause(item);
  //       }}
  //     >
  //       <Image source={item.image_path} style={styles.image} />
  //       <View style={styles.songInfo}>
  //         <Text style={styles.title}>{item.title}</Text>
  //         <Text style={styles.author}>{item.author}</Text>
  //       </View>
  //       <TouchableOpacity
  //         onPress={async (e) => {
  //           e.stopPropagation();
  //           await togglePlayPause(item);
  //         }}
  //       >
  //         <Ionicons
  //           name={
  //             currentSong?.id === item.id && isPlaying
  //               ? "pause-circle"
  //               : "play-circle"
  //           }
  //           size={40}
  //           color="#fff"
  //         />
  //       </TouchableOpacity>
  //     </TouchableOpacity>
  //   ),
  //   [currentSong, isPlaying, togglePlayPause]
  // );

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <SongItem
        song={item}
        onClick={async (id: string) => {
          await togglePlayPause(item);
        }}
      />
    ),
    [togglePlayPause]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.listWrapper,
          currentSong && !showPlayer && { paddingBottom: 130 },
        ]}
      >
        <Text style={styles.headerTitle}>Spotlight</Text>
        <SpotlightBoard />

        <Text style={styles.headerTitle}>Genres</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {genreCards.map((item) => (
            <GenreCard key={item.id} genre={item.name} />
          ))}
        </ScrollView>

        <Text style={styles.headerTitle}>Songs</Text>
        <FlatList
          data={songs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[
            styles.songsContainer,
            currentSong && !showPlayer && { paddingBottom: 10 },
          ]}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  listWrapper: {
    padding: 16,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "auto",
    marginBottom: 16,
  },
  horizontalScroll: {
    paddingVertical: 8,
  },
  songsContainer: {
    marginTop: 16,
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
