import React, { useCallback } from "react";
import { SafeAreaView, Text, ScrollView, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { TrendingUp, Heart, List, Disc } from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useGetLocalSongs } from "@/hooks/data/useGetLocalSongs";
import { usePlayControls } from "@/hooks/audio/useAudioPlayer";
import { useAudioStore } from "@/hooks/stores/useAudioStore";
import { usePlayerStore } from "@/hooks/stores/usePlayerStore";
import SongItem from "@/components/item/SongItem";
import TrendBoard from "@/components/board/TrendBoard";
import Loading from "@/components/common/Loading";
import Error from "@/components/common/Error";
import Song from "@/types";
import { FlatList } from "react-native";
import PlaylistBoard from "@/components/board/PlaylistBoard";
import ForYouBoard from "@/components/board/ForYouBoard";
import HeroBoard from "@/components/board/HeroBoard";

import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";

/**
 * @file index.tsx
 * @description アプリケーションのホーム画面コンポーネント (Badwave Refined)
 */
export default function HomeScreen() {
  const showPlayer = usePlayerStore((state) => state.showPlayer);
  const colors = useThemeStore((state) => state.colors);

  // SQLite から楽曲を取得（Local-First）
  const { data: songs = [], isLoading, error } = useGetLocalSongs();

  const currentSong = useAudioStore((state) => state.currentSong);
  const { togglePlayPause } = usePlayControls(songs, "home");

  const handleSongPress = useCallback(
    async (songId: string) => {
      const song = songs.find((s) => s.id === songId);
      if (song) {
        await togglePlayPause(song);
      }
    },
    [songs, togglePlayPause],
  );

  const renderItem = useCallback(
    ({ item }: { item: Song }) => (
      <SongItem song={item} onClick={handleSongPress} dynamicSize={false} />
    ),
    [handleSongPress],
  );

  const renderSectionTitle = useCallback(
    (title: string, IconComponent: any) => (
      <View style={styles.sectionTitleContainer}>
        <View style={styles.titleRow}>
          <IconComponent size={18} color={colors.primary} strokeWidth={1.5} />
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {title}
          </Text>
        </View>
        <View
          style={[styles.titleSeparator, { backgroundColor: colors.border }]}
        />
      </View>
    ),
    [colors],
  );

  const keyExtractor = useCallback((item: Song) => item.id, []);

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  const sections = [
    { type: "hero" },
    { type: "trending" },
    { type: "foryou" },
    { type: "collections" },
    { type: "recent" },
  ];

  const renderScreenSection = useCallback(
    ({ item }: { item: { type: string } }) => {
      switch (item.type) {
        case "hero":
          return (
            <View style={styles.heroContainer}>
              <HeroBoard />
            </View>
          );
        case "trending":
          return (
            <>
              {renderSectionTitle("Trending Now", TrendingUp)}
              <View style={styles.sectionContent}>
                <TrendBoard />
              </View>
            </>
          );
        case "foryou":
          return (
            <>
              {renderSectionTitle("Personalized for You", Heart)}
              <View style={styles.sectionContent}>
                <ForYouBoard />
              </View>
            </>
          );
        case "collections":
          return (
            <>
              {renderSectionTitle("Your Collections", List)}
              <View style={styles.sectionContent}>
                <PlaylistBoard />
              </View>
            </>
          );
        case "recent":
          return songs && songs.length > 0 ? (
            <>
              {renderSectionTitle("Recently Discovered", Disc)}
              <View style={[styles.sectionContent, styles.songsSection]}>
                <View style={styles.songsList}>
                  <FlashList
                    data={songs}
                    renderItem={renderItem}
                    keyExtractor={keyExtractor}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    estimatedItemSize={200} // Actual width of SongItem mapping (180 + 20 margin)
                    contentContainerStyle={{
                      ...styles.songsContainer,
                      ...(currentSong && !showPlayer
                        ? { paddingBottom: 10 }
                        : {}),
                    }}
                  />
                </View>
              </View>
            </>
          ) : null;
        default:
          return null;
      }
    },
    [
      songs,
      renderItem,
      keyExtractor,
      renderSectionTitle,
      currentSong,
      showPlayer,
    ],
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <FlatList
        data={sections}
        renderItem={renderScreenSection}
        keyExtractor={(item) => item.type}
        contentContainerStyle={[styles.listWrapper, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listWrapper: {
    padding: 24, // Generous padding
  },
  heroContainer: {
    marginTop: 8,
    marginBottom: 32,
  },
  sectionTitleContainer: {
    marginBottom: 20,
    marginTop: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 24,
    fontFamily: FONTS.title, // Bodoni Moda for elegance
    letterSpacing: 0.5,
  },
  titleSeparator: {
    height: 1,
    width: "100%",
    opacity: 0.5,
  },
  sectionContent: {
    marginBottom: 40, // Significant whitespace
  },
  songsSection: {
    marginHorizontal: -24, // Extend to edges
  },
  songsList: {
    height: 340,
  },
  songsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
});
