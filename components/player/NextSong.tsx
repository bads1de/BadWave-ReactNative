import React, { useState, useEffect, memo } from "react";
import { Text, View, StyleSheet } from "react-native";
import { Image } from "expo-image";
import TrackPlayer, {
  useActiveMediaItem,
  RepeatMode,
  type MediaItem,
} from "@rntp/player";
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

  const accent = colors.primaryLight ?? colors.primary;

  return (
    <View style={styles.container}>
      <View style={styles.titleRow}>
        {isShuffleMode ? (
          <Shuffle size={17} color={accent} strokeWidth={1.8} />
        ) : (
          <SkipForward size={18} color={accent} strokeWidth={1.8} />
        )}
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {repeatMode === RepeatMode.One
            ? "Repeating"
            : isShuffleMode
              ? "Shuffle Mode"
              : "Up Next"}
        </Text>
      </View>

      <View style={styles.card}>
        {isShuffleMode ? (
          <>
            <View style={[styles.shuffleTile, { backgroundColor: colors.glow }]}>
              <Shuffle size={22} color="#fff" strokeWidth={1.8} />
            </View>
            <Text style={[styles.shuffleText, { color: colors.subText }]}>
              Music will be played randomly
            </Text>
          </>
        ) : (
          <>
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
                fontFamily={FONTS.semibold}
                style={styles.title}
              />
              <Text
                style={[styles.artist, { color: colors.subText }]}
                numberOfLines={1}
              >
                {nextSong?.artist}
              </Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: FONTS.title,
    letterSpacing: 0.4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.08)",
    borderRadius: 16,
    padding: 12,
  },
  artwork: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
  },
  songInfo: {
    marginLeft: 14,
    flex: 1,
    justifyContent: "center",
  },
  title: {
    marginBottom: 4,
  },
  artist: {
    fontSize: 13,
    fontFamily: FONTS.body,
  },
  shuffleTile: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  shuffleText: {
    marginLeft: 14,
    fontSize: 14,
    fontFamily: FONTS.body,
  },
});

export default memo(NextSong);
