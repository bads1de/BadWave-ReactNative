import { View, Text, StyleSheet, ScrollView, FlatList } from "react-native";
import React, { useState, useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import getLikedSongs from "@/actions/getLikedSongs";
import getPlaylists from "@/actions/getPlaylists";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import CustomButton from "@/components/CustomButton";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import SongItem from "@/components/SongItem";
import Song from "@/types";
import PlaylistItem from "@/components/PlaylistItem";
import { useRouter } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { useAuthStore } from "@/hooks/useAuthStore";
import CreatePlaylist from "@/components/CreatePlaylist";
import { Playlist } from "@/types";

type LibraryType = "liked" | "playlists";

export default function LibraryScreen() {
  const [type, setType] = useState<LibraryType>("liked");
  const { session } = useAuth();
  const { setShowAuthModal } = useAuthStore();
  const router = useRouter();

  const {
    data: likedSongs = [],
    isLoading: isLikedLoading,
    error: likedError,
  } = useQuery({
    queryKey: [CACHED_QUERIES.likedSongs],
    queryFn: getLikedSongs,
    enabled: !!session,
  });

  const {
    data: playlists = [],
    isLoading: isPlaylistsLoading,
    error: playlistsError,
  } = useQuery({
    queryKey: [CACHED_QUERIES.playlists],
    queryFn: getPlaylists,
    enabled: !!session,
  });

  // コンテキストに応じて曲リストを切り替え
  const currentSongs = useMemo(() => {
    if (type === "liked") return likedSongs;
    return [];
  }, [type, likedSongs]);

  const { togglePlayPause } = useAudioPlayer(
    currentSongs,
    type === "liked" ? "liked" : "playlist"
  );

  // プレイリストをクリックしたときのハンドラをメモ化
  const handlePlaylistPress = useCallback(
    (playlist: Playlist) => {
      router.push({
        pathname: "/playlist/[playlistId]",
        params: { playlistId: playlist.id },
      });
    },
    [router]
  );

  // keyExtractor関数をメモ化
  const keyExtractor = useCallback((item: Song | Playlist) => item.id, []);

  const renderLikedSongs = useCallback(
    ({ item }: { item: Song }) => {
      return (
        <SongItem
          key={item.id}
          song={item}
          onClick={async () => await togglePlayPause(item)}
          dynamicSize={true}
        />
      );
    },
    [togglePlayPause]
  );

  // プレイリストのrenderItem関数をメモ化
  const renderPlaylistItem = useCallback(
    ({ item }: { item: Playlist }) => (
      <PlaylistItem playlist={item} onPress={handlePlaylistPress} />
    ),
    [handlePlaylistPress]
  );

  if (isLikedLoading || isPlaylistsLoading) return <Loading />;
  if (likedError || playlistsError)
    return (
      <Error
        message={
          likedError?.message || playlistsError?.message || "An error occurred"
        }
      />
    );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Library</Text>
      {!session ? (
        <View style={styles.loginContainer}>
          <Text style={styles.loginMessage}>
            Please login to view your library
          </Text>
          <CustomButton
            label="Login"
            isActive
            onPress={() => setShowAuthModal(true)}
            activeStyle={styles.loginButton}
            inactiveStyle={styles.loginButton}
            activeTextStyle={styles.loginButtonText}
            inactiveTextStyle={styles.loginButtonText}
          />
        </View>
      ) : (
        <>
          <View style={styles.typeSelector}>
            <CreatePlaylist />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.typeButtons}
            >
              <CustomButton
                label="Liked"
                isActive={type === "liked"}
                activeStyle={styles.typeButtonActive}
                inactiveStyle={styles.typeButton}
                activeTextStyle={styles.typeButtonTextActive}
                inactiveTextStyle={styles.typeButtonText}
                onPress={() => setType("liked")}
                testID="button-Liked"
              />
              <CustomButton
                label="Playlists"
                isActive={type === "playlists"}
                activeStyle={styles.typeButtonActive}
                inactiveStyle={styles.typeButton}
                activeTextStyle={styles.typeButtonTextActive}
                inactiveTextStyle={styles.typeButtonText}
                onPress={() => setType("playlists")}
                testID="button-Playlists"
              />
            </ScrollView>
          </View>
          {type === "liked" ? (
            likedSongs && likedSongs.length > 0 ? (
              <FlatList
                key={"liked"}
                data={likedSongs}
                renderItem={renderLikedSongs}
                keyExtractor={(item) => item.id}
                numColumns={2}
                contentContainerStyle={styles.listContainer}
                windowSize={5}
                maxToRenderPerBatch={8}
                updateCellsBatchingPeriod={50}
                removeClippedSubviews={true}
                initialNumToRender={6}
              />
            ) : (
              <View style={[styles.noSongsContainer, { flex: 1 }]}>
                <Text style={styles.noSongsText}>No songs found.</Text>
              </View>
            )
          ) : playlists && playlists.length > 0 ? (
            <FlatList
              key={"playlists"}
              data={playlists}
              renderItem={renderPlaylistItem}
              numColumns={2}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.listContainer}
              windowSize={5}
              maxToRenderPerBatch={8}
              updateCellsBatchingPeriod={50}
              removeClippedSubviews={true}
              initialNumToRender={6}
            />
          ) : (
            <View style={[styles.noSongsContainer, { flex: 1 }]}>
              <Text style={styles.noSongsText}>No playlists found.</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loginMessage: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
  },
  loginButton: {
    backgroundColor: "#4c1d95",
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
  },
  loginButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
    padding: 16,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
  },
  typeSelector: {
    marginBottom: 16,
  },
  typeButtons: {
    paddingVertical: 8,
    gap: 12,
  },
  typeButton: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  typeButtonActive: {
    backgroundColor: "#4c1d95",
    shadowColor: "#4c1d95",
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 5,
  },
  typeButtonText: {
    color: "rgba(255,255,255,0.6)",
  },
  typeButtonTextActive: {
    color: "#fff",
    textShadowColor: "rgba(255,255,255,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  listContainer: {
    paddingBottom: 100,
  },
  noSongsContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  noSongsText: {
    color: "#fff",
    fontSize: 18,
  },
});
