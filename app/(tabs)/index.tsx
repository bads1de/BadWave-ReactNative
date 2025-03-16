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
import { LinearGradient } from "expo-linear-gradient";
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
import ForYouBoard from "@/components/ForYouBoard";

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

  const renderSectionTitle = (
    title: string,
    icon: React.ComponentProps<typeof Ionicons>["name"]
  ) => (
    <View style={styles.sectionTitleContainer}>
      <LinearGradient
        colors={["#4C1D95", "#7C3AED"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.titleGradient}
      >
        <Ionicons
          name={icon}
          size={22}
          color="#FFFFFF"
          style={styles.titleIcon}
        />
      </LinearGradient>
      <View style={styles.titleTextContainer}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <View style={styles.titleUnderline} />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={["#000", "#050505"]}
        style={styles.backgroundGradient}
      />
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

        {renderSectionTitle("For You", "heart")}
        <View style={styles.sectionContent}>
          <ForYouBoard />
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
    backgroundColor: "#050505",
  },
  backgroundGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  listWrapper: {
    padding: 16,
  },
  sectionTitleContainer: {
    marginBottom: 16,
    marginTop: 24,
    flexDirection: "row",
    alignItems: "center",
  },
  titleGradient: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  titleTextContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  titleIcon: {
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
    textShadowColor: "rgba(124, 58, 237, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  titleUnderline: {
    height: 2,
    width: 40,
    backgroundColor: "#7C3AED",
    marginTop: 4,
    borderRadius: 1,
  },
  sectionContent: {
    marginBottom: 24,
    backgroundColor: "rgba(20, 20, 20, 0.8)",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#7C3AED",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(124, 58, 237, 0.1)",
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
    color: "#ccc",
    fontSize: 14,
  },
  duration: {
    color: "#999",
    fontSize: 12,
    marginTop: 4,
  },
  playButton: {
    marginLeft: 10,
  },
});
