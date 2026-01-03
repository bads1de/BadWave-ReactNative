import React, { useCallback } from "react";
import { SafeAreaView, Text, ScrollView, StyleSheet, View } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useGetLocalSongs } from "@/hooks/data/useGetLocalSongs";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
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

/**
 * @file index.tsx
 * @description アプリケーションのホーム画面コンポーネントです。
 *
 * この画面では、以下のセクションをスクロール形式で表示します。
 * - ヒーローセクション (`HeroBoard`)
 * - トレンド (`TrendBoard`)
 * - あなたへのおすすめ (`ForYouBoard`)
 * - スポットライト (`SpotlightBoard`)
 * - プレイリスト (`PlaylistBoard`)
 * - 全ての曲リスト
 *
 * 各セクションのタイトルと、曲リストの表示および再生機能を提供します。
 * データ取得中のローディング状態やエラー状態もハンドリングします。
 */
export default function HomeScreen() {
  const showPlayer = usePlayerStore((state) => state.showPlayer);
  const { colors } = useThemeStore();

  // SQLite から楽曲を取得（Local-First）
  const { data: songs = [], isLoading, error } = useGetLocalSongs();

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

  const renderSectionTitle = useCallback(
    (title: string, icon: React.ComponentProps<typeof Ionicons>["name"]) => (
      <View style={styles.sectionTitleContainer}>
        <LinearGradient
          colors={[colors.accentFrom, colors.accentTo]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.titleGradient, { shadowColor: colors.glow }]}
        >
          <Ionicons
            name={icon}
            size={22}
            color="#FFFFFF"
            style={styles.titleIcon}
          />
        </LinearGradient>
        <View style={styles.titleTextContainer}>
          <Text
            style={[
              styles.sectionTitle,
              { textShadowColor: colors.glow + "80" }, // 50% opacity
            ]}
          >
            {title}
          </Text>
          <View
            style={[
              styles.titleUnderline,
              { backgroundColor: colors.accentFrom },
            ]}
          />
        </View>
      </View>
    ),
    [colors]
  );

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ScrollView
        contentContainerStyle={[styles.listWrapper, { paddingBottom: 96 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroContainer}>
          <HeroBoard />
        </View>

        {renderSectionTitle("Trends", "trending-up")}
        <View
          style={[
            styles.sectionContent,
            {
              backgroundColor: colors.card + "CC",
              shadowColor: colors.glow,
              borderColor: colors.glow + "1A",
            },
          ]}
        >
          <View style={styles.trendSection}>
            <TrendBoard />
          </View>
        </View>

        {renderSectionTitle("For You", "heart")}
        <View
          style={[
            styles.sectionContent,
            {
              backgroundColor: colors.card + "CC",
              shadowColor: colors.glow,
              borderColor: colors.glow + "1A",
            },
          ]}
        >
          <View style={styles.forYouSection}>
            <ForYouBoard />
          </View>
        </View>

        {renderSectionTitle("Playlists", "list")}
        <View
          style={[
            styles.sectionContent,
            {
              backgroundColor: colors.card + "CC",
              shadowColor: colors.glow,
              borderColor: colors.glow + "1A",
            },
          ]}
        >
          <PlaylistBoard />
        </View>

        {renderSectionTitle("Songs", "disc")}
        {isLoading ? (
          <Loading />
        ) : songs && songs.length > 0 ? (
          <View
            style={[
              styles.sectionContent,
              styles.songsSection,
              {
                backgroundColor: colors.card + "CC",
                shadowColor: colors.glow,
                borderColor: colors.glow + "1A",
              },
            ]}
          >
            <View style={styles.songsList}>
              <FlashList
                data={songs}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                estimatedItemSize={200}
                contentContainerStyle={{
                  ...styles.songsContainer,
                  ...(currentSong && !showPlayer ? { paddingBottom: 10 } : {}),
                }}
              />
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#050505",
  },
  listWrapper: {
    padding: 16,
  },
  heroContainer: {
    marginTop: 8,
    marginBottom: 16,
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
    backgroundColor: "rgba(20, 20, 20, 0.8)", // デフォルト値、JSX側で上書き
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
  },
  horizontalScroll: {
    paddingVertical: 8,
  },
  forYouSection: {
    minHeight: 320,
  },
  trendSection: {
    minHeight: 320,
  },
  songsSection: {
    minHeight: 320,
  },
  songsList: {
    height: 320,
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
