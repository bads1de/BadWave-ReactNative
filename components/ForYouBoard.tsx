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
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
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
