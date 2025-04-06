import React, { useState, useEffect, memo } from "react";
import { Text, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import TrackPlayer, {
  useTrackPlayerEvents,
  Event,
  Track,
  useActiveTrack,
  RepeatMode,
} from "react-native-track-player";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface NextSongProps {
  repeatMode: RepeatMode;
  shuffle: boolean;
}

/**
 * 次の曲を表示するコンポーネント
 * @param {RepeatMode} repeatMode - リピートモード
 * @param {boolean} shuffle - シャッフルモード
 * @returns {React.ReactElement} 次の曲の表示
 */
function NextSong({ repeatMode, shuffle }: NextSongProps) {
  const activeTrack = useActiveTrack();
  const [nextSong, setNextSong] = useState<Track | null>(null);

  useEffect(() => {
    const fetchNextTrack = async () => {
      try {
        // シャッフルモード時は次の曲を表示しない
        if (shuffle && repeatMode !== RepeatMode.Track) {
          return setNextSong(null);
        }

        const queue = await TrackPlayer.getQueue();
        const currentIndex = await TrackPlayer.getActiveTrackIndex();

        if (
          currentIndex === -1 ||
          queue.length === 0 ||
          currentIndex === undefined
        )
          return;

        let nextTrackIndex: number;

        // リピートモードに応じた次の曲の決定
        switch (repeatMode) {
          case RepeatMode.Track:
            // 単曲リピートの場合は現在の曲
            nextTrackIndex = currentIndex;
            break;

          case RepeatMode.Queue:
            // キューリピートの場合
            nextTrackIndex = currentIndex + 1;
            if (nextTrackIndex >= queue.length) {
              nextTrackIndex = 0; // 最初に戻る
            }
            break;

          case RepeatMode.Off:
          default:
            // リピートなしの場合
            nextTrackIndex = currentIndex + 1;
            if (nextTrackIndex >= queue.length) {
              return setNextSong(null); // 次の曲なし
            }
            break;
        }

        setNextSong(queue[nextTrackIndex]);
      } catch (error) {
        console.error("次の曲の取得中にエラーが発生しました:", error);
      }
    };

    fetchNextTrack();
  }, [activeTrack, repeatMode, shuffle]);

  // 曲変更イベントの監視
  useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
    if (event.nextTrack !== null) {
      const track = await TrackPlayer.getTrack(event.nextTrack);
      if (track) {
        setNextSong(track);
      }
    }
  });

  if (!nextSong && !shuffle) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>
        {repeatMode === RepeatMode.Track
          ? "Repeating:"
          : shuffle
          ? "Shuffle Mode"
          : "Next Song:"}
      </Text>
      {shuffle && repeatMode !== RepeatMode.Track ? (
        <View style={styles.shuffleContainer}>
          <MaterialCommunityIcons
            name="shuffle-variant"
            size={24}
            color="#fff"
          />
          <Text style={styles.shuffleText}>?</Text>
        </View>
      ) : (
        <View style={styles.songContainer}>
          <Image
            source={{ uri: nextSong?.artwork }}
            style={styles.artwork}
            cachePolicy="memory-disk"
          />
          <View style={styles.songInfo}>
            <Text style={styles.songName}>{nextSong?.title}</Text>
            <Text style={styles.artist}>{nextSong?.artist}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#1e1e24",
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 8,
  },
  songContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  shuffleContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 12,
  },
  shuffleText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "bold",
  },
  artwork: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  songInfo: {
    marginLeft: 16,
    flex: 1,
  },
  songName: {
    fontSize: 18,
    color: "#fff",
    fontWeight: "600",
  },
  artist: {
    fontSize: 12,
    color: "#666",
  },
});

// メモ化してエクスポート
export default memo(NextSong, (prevProps, nextProps) => {
  // repeatModeとshuffleが同じ場合は再レンダリングしない
  return (
    prevProps.repeatMode === nextProps.repeatMode &&
    prevProps.shuffle === nextProps.shuffle
  );
});
