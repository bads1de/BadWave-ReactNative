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
  ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import getSongs from "@/actions/getSongs";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import SpotlightBoard from "@/components/SpotlightBoard";
import GenreCard from "@/components/GenreCard";
import { CACHED_QUERIES, genreCards } from "@/constants";
import SongItem from "@/components/SongItem";
import TrendBoard from "@/components/TrendBoard";

export default function HomeScreen() {
  const { currentSong, showPlayer } = usePlayerStore();
  const {
    data: songs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.songs],
    queryFn: getSongs,
  });

  const { playSong, isPlaying } = useAudioPlayer(songs);

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error.message}</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4c1d95" />
      </View>
    );
  }

  const renderItem = useCallback(
    ({ item }: { item: any }) => (
      <SongItem
        song={item}
        onClick={async (id: string) => {
          await playSong(item);
        }}
      />
    ),
    [playSong]
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.listWrapper,
          currentSong && !showPlayer && { paddingBottom: 130 },
        ]}
      >
        <Text style={styles.sectionTitle}>Trend</Text>
        <TrendBoard />
        <Text style={styles.sectionTitle}>Spotlight</Text>
        <SpotlightBoard />

        <Text style={styles.sectionTitle}>Genres</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
        >
          {genreCards.map((item) => (
            <GenreCard key={item.id} genre={item.name} />
          ))}
        </ScrollView>

        <Text style={styles.sectionTitle}>Songs</Text>
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
  sectionTitle: {
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
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  errorText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
});
