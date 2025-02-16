import React, { useCallback } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import getPlaylistSongs from "@/actions/getPlaylistSongs";
import SongItem from "@/components/SongItem";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import { SafeAreaView } from "react-native-safe-area-context";
import Song from "@/types";
import { CACHED_QUERIES } from "@/constants";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import DeletePlaylistButton from "@/components/DeletePlaylistButton";

export default function PlaylistDetailScreen() {
  const { playlistId } = useLocalSearchParams<{ playlistId: string }>();

  const {
    data: songs,
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.playlistSongs, playlistId],
    queryFn: () => getPlaylistSongs(playlistId),
    enabled: !!playlistId,
  });

  const { playSong } = useAudioPlayer(songs ?? []);

  const renderSongs = useCallback(
    ({ item }: { item: Song }) => (
      <SongItem
        song={item}
        onClick={async () => {
          await playSong(item);
        }}
        dynamicSize={true}
      />
    ),
    [playSong]
  );

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Playlist Songs</Text>
        <DeletePlaylistButton playlistId={playlistId} />
      </View>
      {songs && songs.length > 0 ? (
        <FlatList
          data={songs}
          keyExtractor={(item: Song) => item.id}
          numColumns={2}
          renderItem={renderSongs}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No songs in this playlist</Text>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 16,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
  },
});
