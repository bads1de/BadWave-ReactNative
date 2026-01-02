import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { ImageBackground } from "expo-image";
import { useFocusEffect, useLocalSearchParams } from "expo-router";
import { useGetLocalSongById } from "@/hooks/data/useGetLocalSongById";
import Loading from "@/components/common/Loading";
import Error from "@/components/common/Error";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import AddPlaylist from "@/components/playlist/AddPlaylist";

import { useHeaderStore } from "@/hooks/stores/useHeaderStore";
import { useRouter } from "expo-router";

export default function SongDetailScreen() {
  const router = useRouter();
  const { songId } = useLocalSearchParams<{ songId: string }>();
  const setShowHeader = useHeaderStore((state) => state.setShowHeader);

  /* Local-first: SQLite から取得 */
  const { data: song, isLoading, error } = useGetLocalSongById(songId);

  const songsArray = useMemo(() => (song ? [song] : []), [song]);

  const { isPlaying, currentSong, togglePlayPause } =
    useAudioPlayer(songsArray);

  useFocusEffect(
    useCallback(() => {
      setShowHeader(false);
      return () => {
        setShowHeader(true);
      };
    }, [setShowHeader])
  );

  const handlePlayPause = useCallback(() => {
    if (!song) return;

    togglePlayPause(song);
  }, [song, togglePlayPause]);

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;
  if (!song) return <Text>Song not found</Text>;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.imageContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <ImageBackground
            source={{ uri: song.image_path! }}
            style={styles.image}
            contentFit="cover"
          >
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.8)"]}
              style={styles.gradientOverlay}
            />
          </ImageBackground>

          <View style={styles.playButtonContainer}>
            <TouchableOpacity onPress={handlePlayPause}>
              <Ionicons
                name={
                  isPlaying && currentSong?.id === song.id
                    ? "pause-circle"
                    : "play-circle"
                }
                size={64}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.detailsContainer}>
          <Text style={styles.title}>{song.title}</Text>
          <Text style={styles.author}>{song.author}</Text>

          <View style={styles.statsContainer}>
            <View style={styles.statsItem}>
              <Ionicons name="play" size={16} color="#ccc" />
              <Text style={styles.statsText}>{song.count}</Text>
            </View>
            <View style={styles.statsItem}>
              <Ionicons name="heart" size={16} color="#ccc" />
              <Text style={styles.statsText}>{song.like_count}</Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <AddPlaylist songId={songId}>
              <View style={styles.addButton}>
                <Ionicons name="add-circle-outline" size={24} color="white" />
                <Text style={styles.addButtonText}>Add to Playlist</Text>
              </View>
            </AddPlaylist>
          </View>

          {song.lyrics && (
            <View style={styles.lyricsContainer}>
              <Text style={styles.lyricsTitle}>Lyrics</Text>
              <Text style={styles.lyricsText}>{song.lyrics}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  scrollViewContent: {
    paddingBottom: 96,
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    aspectRatio: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 100,
  },
  playButtonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
  },
  detailsContainer: {
    padding: 20,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 10,
  },
  author: {
    color: "#ccc",
    fontSize: 18,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 20,
  },
  statsItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  statsText: {
    color: "#ccc",
    fontSize: 16,
    marginLeft: 5,
  },
  buttonContainer: {
    marginTop: 10,
  },
  addButton: {
    backgroundColor: "purple",
    padding: 10,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: "white",
    marginLeft: 5,
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 10,
    zIndex: 1,
    padding: 10,
  },
  lyricsContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: "#222",
    borderRadius: 5,
  },
  lyricsTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
  },
  lyricsText: {
    color: "#fff",
    fontSize: 18,
    textAlign: "center",
    textShadowColor: "#fff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
});

