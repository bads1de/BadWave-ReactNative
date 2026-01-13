import React, { memo, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { useQuery } from "@tanstack/react-query";
import getTopPlayedSongs from "@/actions/getTopPlayedSongs";
import { CACHED_QUERIES } from "@/constants";
import { useUser } from "@/actions/getUser";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import TrackPlayer from "react-native-track-player";
import { useQuickListenStore } from "@/hooks/stores/useQuickListenStore";
import Song from "@/types";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useDownloadedSongs } from "@/hooks/downloads/useDownloadedSongs";

const { width } = Dimensions.get("window");
// Container padding: 16, Margin: 20, Gap: 12
// Width available = width - 40 (margin) - 32 (padding)
// Items = 3, Gaps = 2 * 12 = 24
// Item width = (width - 40 - 32 - 24) / 3 = (width - 96) / 3
const ITEM_WIDTH = (width - 96) / 3;
const ITEM_HEIGHT = ITEM_WIDTH * 1.4;

interface TopPlayedSongItemProps {
  song: Song;
  index: number;
  onPress: (index: number) => void;
  isDisabled: boolean;
}

// メモ化された曲アイテムコンポーネント
const TopPlayedSongItem = memo(
  ({ song, index, onPress, isDisabled }: TopPlayedSongItemProps) => {
    return (
      <TouchableOpacity
        key={song.id}
        style={[styles.songItem, isDisabled && { opacity: 0.5 }]} // 無効時は半透明
        onPress={() => !isDisabled && onPress(index)}
        activeOpacity={0.7}
        disabled={isDisabled}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: song.image_path }}
            style={[styles.songImage, isDisabled && { opacity: 0.5 }]}
            contentFit="cover"
            cachePolicy="memory-disk"
            transition={200}
          />
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.6)"]}
            style={styles.imageGradient}
          />
          {!isDisabled && (
            <View style={styles.playOverlay}>
              <MaterialCommunityIcons name="play" size={20} color="#fff" />
            </View>
          )}
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
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.song.id === nextProps.song.id &&
      prevProps.song.title === nextProps.song.title &&
      prevProps.song.author === nextProps.song.author &&
      prevProps.song.image_path === nextProps.song.image_path &&
      prevProps.index === nextProps.index &&
      prevProps.onPress === nextProps.onPress &&
      prevProps.isDisabled === nextProps.isDisabled
    );
  }
);

TopPlayedSongItem.displayName = "TopPlayedSongItem";

function TopPlayedSongsList() {
  const { data: user } = useUser();
  const userId = user?.id;
  const { isPlaying } = useAudioPlayer();
  const openQuickListen = useQuickListenStore((state) => state.open);

  const { isOnline } = useNetworkStatus();
  const { songs: downloadedSongs } = useDownloadedSongs();

  // ダウンロード済み曲のIDセットを作成（O(1)検索用）
  const downloadedSongIds = useMemo(
    () => new Set(downloadedSongs.map((d) => d.id)),
    [downloadedSongs]
  );

  const { data: topSongs = [] } = useQuery({
    queryKey: [CACHED_QUERIES.topPlayedSongs, userId],
    queryFn: () => getTopPlayedSongs(userId),
    enabled: !!userId,
  });

  const handleSongPress = useCallback(
    async (songIndex: number) => {
      try {
        if (isPlaying) {
          await TrackPlayer.pause();
        }
        // アトミックな更新でQuick Listenを開く
        openQuickListen(topSongs, songIndex);
      } catch (error) {
        console.error("Error handling song press:", error);
      }
    },
    [isPlaying, topSongs, openQuickListen]
  );

  if (!isOnline) return null; // オフライン時は非表示

  if (topSongs.length === 0) return null;

  return (
    <View style={styles.wrapper}>
      <BlurView intensity={20} tint="dark" style={styles.blurContainer}>
        <LinearGradient
          colors={["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
          style={styles.gradient}
        >
          <View style={styles.header}>
            <Text style={styles.label}>ON REPEAT</Text>
            <MaterialCommunityIcons
              name="fire"
              size={16}
              color="#a78bfa"
              style={{ opacity: 0.8 }}
            />
          </View>
          <View style={styles.songsContainer}>
            {topSongs.slice(0, 3).map((song, index) => {
              // ダウンロード済みかチェック（Setを使用してO(1)で検索）
              // topSongsにはlocal_song_pathがないので、downloadedSongIdsと照合
              const isDownloaded = downloadedSongIds.has(song.id);
              const isDisabled = !isOnline && !isDownloaded;

              return (
                <TopPlayedSongItem
                  key={song.id}
                  song={song}
                  index={index}
                  onPress={handleSongPress}
                  isDisabled={isDisabled}
                />
              );
            })}
          </View>
        </LinearGradient>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginBottom: 32,
  },
  blurContainer: {
    width: "100%",
  },
  gradient: {
    padding: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  label: {
    fontSize: 11,
    color: "rgba(255,255,255,0.6)",
    fontWeight: "700",
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  songsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  songItem: {
    width: ITEM_WIDTH,
  },
  imageContainer: {
    width: "100%",
    height: ITEM_HEIGHT,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
    position: "relative",
    backgroundColor: "#2a2a2a",
  },
  songImage: {
    width: "100%",
    height: "100%",
  },
  imageGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "40%",
  },
  playOverlay: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  songInfo: {
    paddingHorizontal: 2,
  },
  songTitle: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 2,
    letterSpacing: 0.2,
  },
  songAuthor: {
    color: "rgba(255,255,255,0.6)",
    fontSize: 11,
    fontWeight: "500",
  },
});

export default memo(TopPlayedSongsList);
