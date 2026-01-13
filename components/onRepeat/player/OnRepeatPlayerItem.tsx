import React, { memo } from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { ImageBackground } from "expo-image";
import { VideoView } from "expo-video";
import { LinearGradient } from "expo-linear-gradient";
import Song from "@/types";
import { useOnRepeatPlayer } from "@/hooks/useOnRepeatPlayer";
import OnRepeatPlayerControls from "./OnRepeatPlayerControls";

const { width, height } = Dimensions.get("screen");

interface OnRepeatPlayerItemProps {
  /** 表示する曲 */
  song: Song;
  /** この曲が現在表示されているか */
  isVisible: boolean;
  /** いいねボタン押下時 */
  onLike?: () => void;
  /** プレイリストに追加ボタン押下時 */
  onAddToPlaylist?: () => void;
  /** フルで聴くボタン押下時 */
  onPlayFull?: () => void;
}

/**
 * OnRepeat Player の個別アイテムコンポーネント
 * Spotify風のリッチなプレビュー画面
 */
function OnRepeatPlayerItem({
  song,
  isVisible,
  onLike,
  onAddToPlaylist,
  onPlayFull,
}: OnRepeatPlayerItemProps) {
  const { player, hasVideo } = useOnRepeatPlayer(song, isVisible);

  return (
    <View style={styles.container}>
      {/* 背景: アルバムアートのブラー */}
      <ImageBackground
        source={{ uri: song.image_path }}
        style={styles.backgroundImage}
        contentFit="cover"
        blurRadius={30}
      >
        <View style={styles.darkOverlay} />
      </ImageBackground>

      {/* メインコンテンツ */}
      <View style={styles.content}>
        {/* 動画/画像エリア */}
        <View style={styles.mediaContainer}>
          {hasVideo ? (
            <VideoView
              player={player}
              style={styles.video}
              contentFit="cover"
              nativeControls={false}
            />
          ) : (
            <ImageBackground
              source={{ uri: song.image_path }}
              style={styles.albumArt}
              contentFit="cover"
            >
              <LinearGradient
                colors={["transparent", "rgba(0,0,0,0.3)"]}
                style={styles.albumArtGradient}
              />
            </ImageBackground>
          )}
        </View>

        {/* 曲情報 */}
        <View style={styles.songInfo}>
          <Text style={styles.title} numberOfLines={2}>
            {song.title}
          </Text>
          <Text style={styles.author} numberOfLines={1}>
            {song.author}
          </Text>
        </View>

        {/* プログレスバー */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: "30%" }]} />
          </View>
        </View>

        {/* アクションボタン */}
        <OnRepeatPlayerControls
          song={song}
          onLike={onLike}
          onAddToPlaylist={onAddToPlaylist}
          onPlayFull={onPlayFull}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    height,
    backgroundColor: "#000",
  },
  backgroundImage: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  darkOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 100,
  },
  mediaContainer: {
    width: width - 48,
    height: width - 48,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 32,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  albumArt: {
    width: "100%",
    height: "100%",
  },
  albumArtGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  songInfo: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  author: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 18,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  progressContainer: {
    width: "100%",
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  progressBar: {
    width: "100%",
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#a78bfa",
    borderRadius: 2,
  },
});

export default memo(OnRepeatPlayerItem, (prevProps, nextProps) => {
  return (
    prevProps.song.id === nextProps.song.id &&
    prevProps.isVisible === nextProps.isVisible
  );
});
