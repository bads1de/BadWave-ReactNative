import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  SafeAreaView,
} from "react-native";
import React, { useState, useCallback } from "react";
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

type LibraryType = "liked" | "playlists";

export default function LibraryScreen() {
  const [type, setType] = useState<LibraryType>("liked");

  const {
    data: likedSongs,
    isLoading: isLikedLoading,
    error: likedError,
  } = useQuery({
    queryKey: [CACHED_QUERIES.likedSongs],
    queryFn: getLikedSongs,
  });

  const {
    data: playlists = [],
    isLoading: isPlaylistsLoading,
    error: playlistsError,
  } = useQuery({
    queryKey: [CACHED_QUERIES.playlists],
    queryFn: getPlaylists,
  });

  const { playSong } = useAudioPlayer(likedSongs || []);

  if (isLikedLoading || isPlaylistsLoading) {
    return <Loading />;
  }

  if (likedError || playlistsError) {
    return <Error message={(likedError || playlistsError)!.message} />;
  }

  const renderLikedSongs = useCallback(
    ({ item }: { item: Song }) => {
      return (
        <SongItem
          song={item}
          onClick={async () => {
            await playSong(item);
          }}
          dynamicSize={true}
        />
      );
    },
    [playSong]
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Library</Text>
      <View style={styles.typeSelector}>
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
          />
          <CustomButton
            label="Playlists"
            isActive={type === "playlists"}
            activeStyle={styles.typeButtonActive}
            inactiveStyle={styles.typeButton}
            activeTextStyle={styles.typeButtonTextActive}
            inactiveTextStyle={styles.typeButtonText}
            onPress={() => setType("playlists")}
          />
        </ScrollView>
      </View>
      {type === "liked" ? (
        likedSongs ? (
          <FlatList
            key={"liked"}
            data={likedSongs}
            renderItem={renderLikedSongs}
            keyExtractor={(item) => item.id}
            numColumns={2}
            contentContainerStyle={styles.listContainer}
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
          renderItem={({ item }) => (
            <PlaylistItem playlist={item} onPress={() => {}} />
          )}
          numColumns={2}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <View style={[styles.noSongsContainer, { flex: 1 }]}>
          <Text style={styles.noSongsText}>No playlists found.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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
