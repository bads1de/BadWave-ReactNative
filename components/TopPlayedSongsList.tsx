import React, { memo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery } from "@tanstack/react-query";
import getTopPlayedSongs from "@/actions/getTopPlayedSongs";
import { CACHED_QUERIES } from "@/constants";
import { useUser } from "@/actions/getUser";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import TrackPlayer from "react-native-track-player";
import { useSubPlayerStore } from "@/hooks/useSubPlayerStore";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = (width - 104) / 3;
const ITEM_HEIGHT = ITEM_WIDTH * 1.5;

function TopPlayedSongsList() {
  const { data: user } = useUser();
  const userId = user?.id;
  const { isPlaying } = useAudioPlayer();
  const { setShowSubPlayer, setSongs, setCurrentSongIndex } =
    useSubPlayerStore();

  const { data: topSongs = [] } = useQuery({
    queryKey: [CACHED_QUERIES.topPlayedSongs, userId],
    queryFn: () => getTopPlayedSongs(userId),
    enabled: !!userId,
  });

  /**
   * 曲がタップされたときの処理
   * 改善点: 状態更新の確実性向上とリソース管理の改善
   * @param songIndex 選択された曲のインデックス
   */
  const handleSongPress = async (songIndex: number) => {
    try {
      // 既存の再生中の曲を一時停止
      if (isPlaying) {
        await TrackPlayer.pause();
      }

      // サブプレイヤーの状態をリセット
      // バッチ処理で状態更新を最適化
      setCurrentSongIndex(-1); // 一度無効なインデックスをセット
      setSongs([]); // 曲リストをクリア

      // 状態更新が確実に反映されるよう少し待機
      // Reactのバッチ更新を利用するために非同期処理を使用
      await new Promise<void>((resolve) => {
        // 次のレンダリングサイクルで確実に実行されるようにする
        requestAnimationFrame(() => {
          // 新しい状態を設定
          setSongs(topSongs);
          setCurrentSongIndex(songIndex);
          setShowSubPlayer(true);
          resolve();
        });
      });
    } catch (error) {
      console.error("Error handling song press:", error);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        <Text style={styles.sectionTitle}>Top Played Songs</Text>
        <View style={styles.songsContainer}>
          {topSongs.map((song, index) => (
            <TouchableOpacity
              key={song.id}
              style={styles.songItem}
              onPress={() => handleSongPress(index)}
            >
              <View
                style={[
                  styles.songImage,
                  { borderRadius: 8, overflow: "hidden" },
                ]}
              >
                <Image
                  source={{ uri: song.image_path }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                  cachePolicy="disk"
                />
              </View>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  cardContainer: {
    backgroundColor: "#1e1e24",
    borderRadius: 16,
    padding: 20,
    margin: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 16,
    marginLeft: 0,
  },
  songsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
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

export default memo(TopPlayedSongsList);
