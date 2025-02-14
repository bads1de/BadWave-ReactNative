import { View, Text, StyleSheet, ScrollView } from "react-native";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import getLikedSongs from "@/actions/getLikedSongs";
import getPlaylists from "@/actions/getPlaylists";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import CustomButton from "@/components/CustomButton";

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

  if (isLikedLoading || isPlaylistsLoading) {
    return <Loading />;
  }

  if (likedError || playlistsError) {
    return <Error message={(likedError || playlistsError)!.message} />;
  }

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
});
