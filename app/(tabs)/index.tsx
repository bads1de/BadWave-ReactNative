import React, { useCallback, useMemo } from "react";
import { Text, StyleSheet, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { FlashList } from "@shopify/flash-list";
import { TrendingUp, Heart, List, Disc } from "lucide-react-native";
import { useGetLocalSongs } from "@/hooks/data/useGetLocalSongs";
import { usePlayControls } from "@/hooks/audio/useAudioPlayer";
import { useAudioStore } from "@/hooks/stores/useAudioStore";
import { usePlayerStore } from "@/hooks/stores/usePlayerStore";
import SongItem from "@/components/item/SongItem";
import TrendBoard from "@/components/board/TrendBoard";
import Loading from "@/components/common/Loading";
import Error from "@/components/common/Error";
import Song from "@/types";
import PlaylistBoard from "@/components/board/PlaylistBoard";
import ForYouBoard from "@/components/board/ForYouBoard";
import HeroBoard from "@/components/board/HeroBoard";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { FONTS } from "@/constants/theme";

/**
 * @file index.tsx
 * @description アプリケーションのホーム画面コンポーネント (Badwave Refined)
 */

type HomeSectionKey = "hero" | "trending" | "forYou" | "playlists" | "recent";

export default function HomeScreen() {
  const showPlayer = usePlayerStore((state) => state.showPlayer);
  const colors = useThemeStore((state) => state.colors);

  // SQLite から楽曲を取得（Local-First）
  const { data: songs = [], isLoading, error } = useGetLocalSongs();

  const currentSong = useAudioStore((state) => state.currentSong);
  const { togglePlayPause } = usePlayControls(songs, "home");

  // ネットワーク状態はここで1回だけ取得し、各 SongItem に props として渡す
  const { isOnline } = useNetworkStatus();

  const handleSongPress = useCallback(
    async (songId: string) => {
      const song = songs.find((s) => s.id === songId);
      if (song) {
        await togglePlayPause(song);
      }
    },
    [songs, togglePlayPause],
  );

  const renderRecentSongItem = useCallback(
    ({ item }: { item: Song }) => (
      <SongItem
        song={item}
        onClick={handleSongPress}
        dynamicSize={false}
        isOnline={isOnline}
      />
    ),
    [handleSongPress, isOnline],
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

  const keyExtractorRecent = useCallback((item: Song) => item.id, []);
  const homeSections = useMemo<HomeSectionKey[]>(
    () =>
      songs.length > 0
        ? ["hero", "trending", "forYou", "playlists", "recent"]
        : ["hero", "trending", "forYou", "playlists"],
    [songs.length],
  );
  const keyExtractorSection = useCallback((item: HomeSectionKey) => item, []);
  const getSectionType = useCallback((item: HomeSectionKey) => item, []);

  const renderHomeSection = useCallback(
    ({ item }: { item: HomeSectionKey }) => {
      switch (item) {
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
        case "forYou":
          return (
            <>
              {renderSectionTitle("Personalized for You", Heart)}
              <View style={styles.sectionContent}>
                <ForYouBoard />
              </View>
            </>
          );
        case "playlists":
          return (
            <>
              {renderSectionTitle("Your Collections", List)}
              <View style={styles.sectionContent}>
                <PlaylistBoard />
              </View>
            </>
          );
        case "recent":
          return (
            <>
              {renderSectionTitle("Recently Discovered", Disc)}
              <View style={[styles.sectionContent, styles.songsSection]}>
                <View style={styles.songsList}>
                  <FlashList
                    data={songs}
                    renderItem={renderRecentSongItem}
                    keyExtractor={keyExtractorRecent}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    estimatedItemSize={200}
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
          );
      }
    },
    [
      currentSong,
      keyExtractorRecent,
      renderRecentSongItem,
      renderSectionTitle,
      showPlayer,
      songs,
    ],
  );

  // ★ 早期リターンはすべてのフック定義の後に置く
  if (isLoading) return <Loading variant="home" />;
  if (error) return <Error message={error.message} />;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <FlashList
        data={homeSections}
        renderItem={renderHomeSection}
        keyExtractor={keyExtractorSection}
        getItemType={getSectionType}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listWrapper}
        estimatedItemSize={420}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listWrapper: {
    padding: 24,
    paddingBottom: 120,
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
    fontFamily: FONTS.title,
    letterSpacing: 0.5,
  },
  titleSeparator: {
    height: 1,
    width: "100%",
    opacity: 0.5,
  },
  sectionContent: {
    marginBottom: 40,
  },
  songsSection: {
    marginHorizontal: -24,
  },
  songsList: {
    height: 340,
  },
  songsContainer: {
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
});
