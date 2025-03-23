import React, { useCallback } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import SongItem from "@/components/SongItem";
import getRecommendations from "@/actions/getRecommendations";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import Song from "@/types";
import Error from "@/components/Error";
import Loading from "./Loading";

export default function ForYouBoard() {
  const {
    data: recommendations = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.getRecommendations],
    queryFn: () => getRecommendations(10),
  });

  const { togglePlayPause } = useAudioPlayer(recommendations, "forYou");

  // 曲をクリックしたときのハンドラをメモ化
  const handleSongClick = useCallback(
    async (songId: string) => {
      const song = recommendations.find((s) => s.id === songId);
      if (song) {
        await togglePlayPause(song);
      }
    },
    [recommendations, togglePlayPause]
  );

  // レンダリング関数をメモ化
  const renderItem = useCallback(
    ({ item }: { item: Song }) => (
      <SongItem
        song={item}
        key={item.id}
        onClick={handleSongClick}
        dynamicSize={false}
      />
    ),
    [handleSongClick]
  );

  // keyExtractor関数をメモ化
  const keyExtractor = useCallback((item: Song) => item.id, []);

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  if (recommendations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          まだおすすめの曲がありません。もっと曲を聴いて、あなた好みの曲をおすすめします。
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={recommendations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        windowSize={3}
        maxToRenderPerBatch={5}
        updateCellsBatchingPeriod={50}
        removeClippedSubviews={true}
        initialNumToRender={3}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  listContent: {
    paddingVertical: 8,
  },
  loadingContainer: {
    height: 320,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
