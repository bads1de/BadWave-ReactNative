import React, { useCallback } from "react";
import {
  SafeAreaView,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
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
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import Song from "@/types";

export default function HomeScreen() {
  const { showPlayer } = usePlayerStore();
  const {
    data: songs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.songs],
    queryFn: getSongs,
  });

  const { togglePlayPause, currentSong } = useAudioPlayer(songs, "home");

  const renderItem = useCallback(
    ({ item }: { item: Song }) => (
      <SongItem
        song={item}
        key={item.id}
        onClick={async () => await togglePlayPause(item)}
        dynamicSize={false}
      />
    ),
    [togglePlayPause]
  );

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.listWrapper,
          currentSong && !showPlayer && { paddingBottom: 130 },
        ]}
      >
        <Text style={styles.sectionTitle}>Trends</Text>
        <TrendBoard />
        <Text style={styles.sectionTitle}>Spotlights</Text>
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
        {isLoading ? (
          <Loading />
        ) : (
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
        )}
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
});
