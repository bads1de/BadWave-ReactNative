import React, { useState, useEffect, memo } from "react";
import { Text, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import TrackPlayer, {
  useActiveMediaItem,
  RepeatMode,
  type MediaItem,
} from "@rntp/player";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SkipForward, Shuffle } from "lucide-react-native";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";

import MarqueeText from "@/components/common/MarqueeText";

import { useAudioStore } from "@/hooks/stores/useAudioStore";

/**
 * 次の曲を表示するコンポーネント
 * @returns {React.ReactElement} 次の曲の表示
 */
function NextSong() {
  const activeTrack = useActiveMediaItem();
  const [nextSong, setNextSong] = useState<MediaItem | null>(null);
  const colors = useThemeStore((state) => state.colors);

  // Zustandから直接最小限の状態を購読
  const repeatMode = useAudioStore((state) => state.repeatMode);
  const shuffle = useAudioStore((state) => state.shuffle);

  useEffect(() => {
    const fetchNextTrack = async () => {
      try {
        // シャッフルモード時は次の曲を表示しない
        if (shuffle && repeatMode !== RepeatMode.One) {
          return setNextSong(null);
        }

        const queue = TrackPlayer.getQueue();
        const currentIndex = TrackPlayer.getActiveMediaItemIndex();

        if (currentIndex === null || queue.length === 0) return;

        let nextTrackIndex: number;

        // リピートモードに応じた次の曲の決定
        switch (repeatMode) {
          case RepeatMode.One:
            // 単曲リピートの場合は現在の曲
            nextTrackIndex = currentIndex;
            break;

          case RepeatMode.All:
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

        // 次の曲のアートワークをプリフェッチして表示をスムーズにする
        const nextArtwork = queue[nextTrackIndex]?.artworkUrl;
        if (nextArtwork && typeof nextArtwork === "string") {
          Image.prefetch([nextArtwork]).catch(() => {
            // プリフェッチ失敗はサイレントに無視
          });
        }
      } catch (error) {
        console.error("次の曲の取得中にエラーが発生しました:", error);
      }
    };

    fetchNextTrack();
  }, [activeTrack, repeatMode, shuffle]);

  if (!nextSong && !shuffle) {
    return null;
  }

  const isShuffleMode = shuffle && repeatMode !== RepeatMode.One;
  const nextArtworkUri =
    typeof nextSong?.artworkUrl === "string" ? nextSong.artworkUrl : undefined;

  return (
    <View style={styles.container}>
      <View style={styles.sectionTitleContainer}>
        <View style={styles.titleRow}>
          {isShuffleMode ? (
            <Shuffle size={20} color={colors.primary} strokeWidth={1.5} />
          ) : (
            <SkipForward size={22} color={colors.primary} strokeWidth={1.5} />
          )}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {repeatMode === RepeatMode.One
              ? "Repeating"
              : isShuffleMode
                ? "Shuffle Mode"
                : "Up Next"}
          </Text>
        </View>
        <View
          style={[
            styles.titleSeparator,
            { backgroundColor: "rgba(255, 255, 255, 0.1)" },
          ]}
        />
      </View>

      <View style={styles.contentContainer}>
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
                <MaterialCommunityIcons name="help" size={12} color="#000" />
              </View>
            </View>
            <Text style={styles.shuffleText}>
              Music will be played randomly
            </Text>
          </View>
        ) : (
          <View style={styles.songContent}>
            <Image
              source={{ uri: nextArtworkUri }}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  sectionTitleContainer: {
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontFamily: FONTS.title,
    letterSpacing: 0.5,
  },
  titleSeparator: {
    height: 1,
    width: "100%",
    opacity: 0.6,
  },
  contentContainer: {
    paddingHorizontal: 4,
  },
  songContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  artwork: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: "rgba(40, 40, 40, 0.5)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
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

export default memo(NextSong);
