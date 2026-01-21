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

import MarqueeText from "@/components/common/MarqueeText";

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

  const isShuffleMode = shuffle && repeatMode !== RepeatMode.Track;

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <Text style={styles.label}>
          {repeatMode === RepeatMode.Track
            ? "REPEATING"
            : isShuffleMode
              ? "SHUFFLE MODE"
              : "UP NEXT"}
        </Text>
        {isShuffleMode && (
          <MaterialCommunityIcons
            name="shuffle-variant"
            size={16}
            color="#a78bfa"
          />
        )}
      </View>

      {isShuffleMode ? (
        <View style={styles.shuffleContent}>
          <View style={styles.shuffleIconContainer}>
            <MaterialCommunityIcons
              name="music-note-eighth"
              size={32}
              color="#fff"
              style={{ opacity: 0.8 }}
            />
            <View style={styles.questionMark}>
              <MaterialCommunityIcons name="help" size={14} color="#000" />
            </View>
          </View>
          <Text style={styles.shuffleText}>Music will be played randomly</Text>
        </View>
      ) : (
        <View style={styles.songContent}>
          <Image
            source={{ uri: nextSong?.artwork }}
            style={styles.artwork}
            cachePolicy="memory-disk"
            contentFit="cover"
            transition={200}
          />
          <View style={styles.songInfo}>
            <MarqueeText
              text={nextSong?.title || ""}
              speed={0.3}
              fontSize={16}
              style={{ marginBottom: 4 }}
            />
            <Text style={styles.artist} numberOfLines={1}>
              {nextSong?.artist}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    padding: 16,
  },
  // Removed blurContainer, gradient
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  songContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  artwork: {
    width: 56,
    height: 56,
    borderRadius: 8, // Adjusted radius slightly
    backgroundColor: "#2a2a2a",
  },
  songInfo: {
    marginLeft: 14,
    flex: 1,
    justifyContent: "center",
  },
  artist: {
    fontSize: 13,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "500",
  },

  shuffleContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  shuffleIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(167, 139, 250, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  questionMark: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#a78bfa",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#1e1e24",
  },
  shuffleText: {
    marginLeft: 16,
    fontSize: 14,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "500",
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
