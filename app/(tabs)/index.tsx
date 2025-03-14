import React, { useCallback } from "react";
import {
  SafeAreaView,
  Text,
  ScrollView,
  StyleSheet,
  FlatList,
  View,
  StatusBar,
  Dimensions,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
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
import PlaylistBoard from "@/components/PlaylistBoard";

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

  const renderSectionTitle = (title: string, icon: React.ComponentProps<typeof Ionicons>["name"]) => (
    <View style={styles.sectionTitleContainer}>
      <View style={styles.titleRow}>
        <Ionicons
          name={icon}
          size={22}
          color="#4C1D95"
          style={styles.titleIcon}
        />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.titleUnderline} />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <ScrollView
        contentContainerStyle={[
          styles.listWrapper,
          currentSong && !showPlayer && { paddingBottom: 130 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {renderSectionTitle("Trends", "trending-up")}
        <View style={styles.sectionContent}>
          <TrendBoard />
        </View>

        {renderSectionTitle("Spotlights", "flash")}
        <View style={styles.sectionContent}>
          <SpotlightBoard />
        </View>

        {renderSectionTitle("Playlists", "list")}
        <View style={styles.sectionContent}>
          <PlaylistBoard />
        </View>

        {renderSectionTitle("Genres", "musical-notes")}
        <View style={styles.sectionContent}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalScroll}
          >
            {genreCards.map((item) => (
              <GenreCard key={item.id} genre={item.name} />
            ))}
          </ScrollView>
        </View>

        {renderSectionTitle("Songs", "disc")}
        {isLoading ? (
          <Loading />
        ) : (
          <View style={styles.sectionContent}>
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
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0A0A0A", // 深い黒だが純粋な黒よりも少し明るい
  },
  listWrapper: {
    padding: 16,
  },
  sectionTitleContainer: {
    marginBottom: 16,
    marginTop: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  titleIcon: {
    marginRight: 8,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  titleUnderline: {
    height: 2,
    width: 40,
    backgroundColor: "#4C1D95",
    marginTop: 4,
  },
  sectionContent: {
    marginBottom: 24,
    backgroundColor: "#111",
    borderRadius: 12,
    padding: 12,
    shadowColor: "#4C1D95",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  horizontalScroll: {
    paddingVertical: 8,
  },
  songsContainer: {
    paddingVertical: 8,
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#1A1A1A",
    marginBottom: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4C1D95",
  },
  image: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  songInfo: {
    flex: 1,
    marginLeft: 15,
  },
  title: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  author: {
    color: "#A78BFA", // 薄い紫色
    fontSize: 14,
    marginTop: 2,
  },
});
