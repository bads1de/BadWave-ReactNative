import React, { useCallback, memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import SongItem from "@/components/item/SongItem";
import getRecommendations from "@/actions/getRecommendations";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import Song from "@/types";
import Error from "@/components/common/Error";
import Loading from "@/components/common/Loading";

function ForYouBoard() {
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
      <FlashList
        data={recommendations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        estimatedItemSize={220}
      />
    </View>
  );
}

export default memo(ForYouBoard);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 240,
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
