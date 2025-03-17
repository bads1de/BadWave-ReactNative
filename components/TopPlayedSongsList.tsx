import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import getTopPlayedSongs from "@/actions/getTopPlayedSongs";
import { CACHED_QUERIES } from "@/constants";
import { useUser } from "@/actions/getUser";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import TrackPlayer from "react-native-track-player";
import { usePlayerStore } from "@/hooks/usePlayerStore";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 48) / 3;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5; // 縦長比率を1.5倍に設定

export default function TopPlayedSongsList() {
  const { data: user } = useUser();
  const userId = user?.id;

  const { data: topSongs = [] } = useQuery({
    queryKey: [CACHED_QUERIES.topPlayedSongs, userId],
    queryFn: () => getTopPlayedSongs(userId),
    enabled: !!userId,
  });

  const { togglePlayPause, isPlaying } = useAudioPlayer(topSongs);
  const { setShowSwipeablePlayer, setActiveSongIndex } = usePlayerStore();

  if (topSongs.length === 0) return null;

  // 曲をクリックしたときの処理
  const handleSongPress = async (index: number) => {
    // 現在再生中の曲があれば停止
    if (isPlaying) {
      await TrackPlayer.pause();
    }
    
    // 選択曲のインデックスを保存し、スワイプ可能なプレイヤーを表示
    setActiveSongIndex(index);
    setShowSwipeablePlayer(true);
    
    // 選択した曲を再生
    await togglePlayPause(topSongs[index], undefined, "search");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Your Top Played Songs</Text>
      <View style={styles.songsContainer}>
        {topSongs.map((song, index) => (
          <TouchableOpacity
            key={song.id}
            style={styles.songItem}
            onPress={() => handleSongPress(index)}
          >
            <ImageBackground
              source={{ uri: song.image_path }}
              style={styles.songImage}
              imageStyle={{ borderRadius: 8 }}
            >
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.8)"]}
                style={styles.gradient}
              />
            </ImageBackground>
            <View style={styles.songInfo}>
              <Text numberOfLines={1} style={styles.songTitle}>
                {song.title}
              </Text>
              <Text numberOfLines={1} style={styles.songAuthor}>
                {song.author}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  songsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  songItem: {
    width: ITEM_WIDTH,
    borderRadius: 8,
    overflow: "hidden",
  },
  songImage: {
    width: "100%",
    height: ITEM_HEIGHT,
    justifyContent: "flex-end",
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "70%",
  },
  songInfo: {
    padding: 8,
  },
  songTitle: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "bold",
  },
  songAuthor: {
    color: "#999",
    fontSize: 10,
  },
});
