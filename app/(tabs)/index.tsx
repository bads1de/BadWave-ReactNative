import React, { useCallback, useMemo } from "react";
import { Text, StyleSheet, View, FlatList } from "react-native";
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
import { FONTS } from "@/constants/theme";

/**
 * @file index.tsx
 * @description アプリケーションのホーム画面コンポーネント (Badwave Refined)
 */

// セクションの種類を定義
enum HomeSectionType {
  HERO = "HERO",
  TRENDING = "TRENDING",
  FOR_YOU = "FOR_YOU",
  PLAYLISTS = "PLAYLISTS",
  RECENTLY_DISCOVERED = "RECENTLY_DISCOVERED",
}

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

  const renderRecentSongItem = useCallback(
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

  const keyExtractorRecent = useCallback((item: Song) => item.id, []);

  // 画面構成データ
  const sections = useMemo(() => {
    const data = [
      { id: HomeSectionType.HERO },
      { id: HomeSectionType.TRENDING },
      { id: HomeSectionType.FOR_YOU },
      { id: HomeSectionType.PLAYLISTS },
    ];
    
    // 最近見つけた曲がある場合のみセクションを追加
    if (songs && songs.length > 0) {
      data.push({ id: HomeSectionType.RECENTLY_DISCOVERED });
    }
    
    return data;
  }, [songs]);

  // 各セクションのレンダリング
  const renderSection = useCallback(
    ({ item }: { item: { id: HomeSectionType } }) => {
      switch (item.id) {
        case HomeSectionType.HERO:
          return (
            <View style={styles.heroContainer}>
              <HeroBoard />
            </View>
          );
        case HomeSectionType.TRENDING:
          return (
            <>
              {renderSectionTitle("Trending Now", TrendingUp)}
              <View style={styles.sectionContent}>
                <TrendBoard />
              </View>
            </>
          );
        case HomeSectionType.FOR_YOU:
          return (
            <>
              {renderSectionTitle("Personalized for You", Heart)}
              <View style={styles.sectionContent}>
                <ForYouBoard />
              </View>
            </>
          );
        case HomeSectionType.PLAYLISTS:
          return (
            <>
              {renderSectionTitle("Your Collections", List)}
              <View style={styles.sectionContent}>
                <PlaylistBoard />
              </View>
            </>
          );
        case HomeSectionType.RECENTLY_DISCOVERED:
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
        default:
          return null;
      }
    },
    [
      renderSectionTitle,
      renderRecentSongItem,
      keyExtractorRecent,
      songs,
      currentSong,
      showPlayer,
    ]
  );

  // ★ 早期リターンはすべてのフック定義の後に置く
  if (isLoading) return <Loading variant="home" />;
  if (error) return <Error message={error.message} />;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <FlatList
        data={sections}
        renderItem={renderSection}
        keyExtractor={(item) => item.id}
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
    padding: 24,
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
