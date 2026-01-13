import React, { memo, FC } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StyleSheet as RNStyleSheet,
  ScrollView,
} from "react-native";
import { ImageBackground } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import Song from "@/types";
import { RepeatMode } from "react-native-track-player";
import MarqueeText from "../common/MarqueeText";
import AddPlaylist from "../playlist/AddPlaylist";
import LikeButton from "../LikeButton";
import Lyric from "./lyric";
import NextSong from "./NextSong";
import OnRepeat from "../onRepeat/OnRepeat";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { ThemeDefinition } from "@/constants/ThemeColors";
import PlayerProgress from "./PlayerProgress";

/**
 * @fileoverview 音楽プレーヤーのUIコンポーネント
 * このモジュールは、アプリケーションのメインプレーヤーUIを提供します。
 */

/**
 * プレーヤーコンポーネントのプロパティ
 */
interface PlayerProps {
  /** 再生中かどうか */
  isPlaying: boolean;
  /** 現在の楽曲情報 */
  currentSong: Song;
  /** 再生/一時停止の切り替えハンドラ */
  onPlayPause: () => void;
  /** 次の曲への遷移ハンドラ */
  onNext: () => void;
  /** 前の曲への遷移ハンドラ */
  onPrev: () => void;
  /** シーク操作時のハンドラ */
  onSeek: (millis: number) => void;
  /** プレーヤーを閉じる際のハンドラ */
  onClose: () => void;
  /** リピートモード (Off, Track, Queue) */
  repeatMode: RepeatMode.Off | RepeatMode.Track | RepeatMode.Queue;
  /** リピートモードの変更ハンドラ */
  setRepeatMode: (
    mode: RepeatMode.Off | RepeatMode.Track | RepeatMode.Queue
  ) => void;
  /** シャッフル再生が有効かどうか */
  shuffle: boolean;
  /** シャッフル設定の変更ハンドラ */
  setShuffle: (value: boolean) => void;
}

/**
 * 楽曲情報表示部分のプロパティ
 */
interface SongInfoProps {
  currentSong: Song;
}

/**
 * 再生コントロールボタン群のプロパティ
 */
interface ControlsProps {
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  shuffle: boolean;
  setShuffle: (value: boolean) => void;
  repeatMode: RepeatMode.Off | RepeatMode.Track | RepeatMode.Queue;
  setRepeatMode: (
    mode: RepeatMode.Off | RepeatMode.Track | RepeatMode.Queue
  ) => void;
  colors: ThemeDefinition["colors"];
}

/**
 * 個別のコントロールボタンのプロパティ
 */
interface ControlButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  isActive?: boolean;
  onPress: () => void;
  repeatMode?: RepeatMode.Off | RepeatMode.Track | RepeatMode.Queue;
  testID?: string;
  activeColor?: string;
}

/**
 * 再生/一時停止ボタンのプロパティ
 */
interface PlayPauseButtonProps {
  isPlaying: boolean;
  onPress: () => void;
}

/**
 * メディア背景 (ビデオまたは画像) のプロパティ
 */
interface MediaBackgroundProps {
  videoUrl?: string | null;
  imageUrl?: string | null;
}

const { width, height } = Dimensions.get("window");

const SongInfo: FC<SongInfoProps> = memo(({ currentSong }) => (
  <View style={styles.infoContainer}>
    <View style={styles.textContainer}>
      <MarqueeText
        text={currentSong.title}
        style={styles.titleContainer}
        speed={0.5}
        withGesture={false}
        fontSize={24}
      />
      <Text style={styles.author}>{currentSong.author}</Text>
    </View>
    <AddPlaylist songId={currentSong.id} />
    <View style={{ paddingHorizontal: 8 }} />
    <LikeButton songId={currentSong.id} />
  </View>
));
SongInfo.displayName = "SongInfo";

const Controls: FC<ControlsProps> = memo(
  ({
    isPlaying,
    onPlayPause,
    onNext,
    onPrev,
    shuffle,
    setShuffle,
    repeatMode,
    setRepeatMode,
    colors,
  }) => (
    <View style={styles.controls}>
      <ControlButton
        icon="shuffle"
        isActive={shuffle}
        onPress={() => setShuffle(!shuffle)}
        testID="shuffle-button"
        activeColor={colors.primary}
      />
      <ControlButton
        icon="play-skip-back"
        onPress={onPrev}
        testID="prev-button"
        activeColor={colors.primary}
      />
      <PlayPauseButton isPlaying={isPlaying} onPress={onPlayPause} />
      <ControlButton
        icon="play-skip-forward"
        onPress={onNext}
        testID="next-button"
        activeColor={colors.primary}
      />
      <ControlButton
        icon="repeat"
        isActive={repeatMode !== RepeatMode.Off}
        onPress={() => {
          switch (repeatMode) {
            case RepeatMode.Off:
              setRepeatMode(RepeatMode.Track);
              break;
            case RepeatMode.Track:
              setRepeatMode(RepeatMode.Queue);
              break;
            case RepeatMode.Queue:
              setRepeatMode(RepeatMode.Off);
              break;
          }
        }}
        repeatMode={repeatMode}
        testID="repeat-button"
        activeColor={colors.primary}
      />
    </View>
  )
);
Controls.displayName = "Controls";

const ControlButton: FC<ControlButtonProps> = memo(
  ({ icon, isActive, onPress, repeatMode, testID, activeColor }) => {
    // リピートボタンの場合
    if (icon === "repeat") {
      return (
        <View>
          <TouchableOpacity
            onPress={onPress}
            style={styles.repeatButton}
            testID={testID}
          >
            <Ionicons
              name={isActive ? "repeat" : "repeat-outline"}
              size={25}
              color={isActive ? activeColor : "#fff"}
            />
            {isActive && (
              <Text
                style={[styles.repeatModeIndicator, { color: activeColor }]}
              >
                {repeatMode === RepeatMode.Track ? "1" : ""}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      );
    }

    // 通常のコントロールボタン
    return (
      <TouchableOpacity onPress={onPress} testID={testID}>
        <Ionicons
          name={icon}
          size={25}
          color={isActive ? activeColor : "#fff"}
        />
      </TouchableOpacity>
    );
  }
);
ControlButton.displayName = "ControlButton";

const PlayPauseButton: FC<PlayPauseButtonProps> = memo(
  ({ isPlaying, onPress }) => (
    <TouchableOpacity
      style={styles.playButton}
      onPress={onPress}
      testID="play-pause-button"
    >
      <Ionicons
        name={isPlaying ? "pause-circle" : "play-circle"}
        size={70}
        color="#fff"
      />
    </TouchableOpacity>
  )
);
PlayPauseButton.displayName = "PlayPauseButton";

const MediaBackground: FC<MediaBackgroundProps> = memo(
  ({ videoUrl, imageUrl }) => {
    // useVideoPlayerを使用してビデオプレーヤーを作成
    const player = useVideoPlayer({ uri: videoUrl || undefined }, (player) => {
      if (videoUrl) {
        player.muted = true;
        player.loop = true;
        player.play();
      }
    });

    if (videoUrl) {
      return (
        <View style={styles.backgroundImage} testID="background-video">
          <VideoView
            player={player}
            style={[RNStyleSheet.absoluteFill, styles.backgroundVideo]}
            contentFit="cover"
            nativeControls={false}
          />
        </View>
      );
    }

    return (
      <ImageBackground
        source={{ uri: imageUrl! }}
        style={styles.backgroundImage}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    );
  }
);
MediaBackground.displayName = "MediaBackground";

const PlayerControls: FC<PlayerProps & { colors: ThemeDefinition["colors"] }> =
  memo(
    ({
      isPlaying,
      onPlayPause,
      onNext,
      onPrev,
      onSeek,
      shuffle,
      setShuffle,
      repeatMode,
      setRepeatMode,
      currentSong,
      colors,
    }) => (
      <>
        <SongInfo currentSong={currentSong} />
        <PlayerProgress onSeek={onSeek} />
        <Controls
          isPlaying={isPlaying}
          onPlayPause={onPlayPause}
          onNext={onNext}
          onPrev={onPrev}
          shuffle={shuffle}
          setShuffle={setShuffle}
          repeatMode={repeatMode}
          setRepeatMode={setRepeatMode}
          colors={colors}
        />
      </>
    )
  );
PlayerControls.displayName = "PlayerControls";

function Player(props: PlayerProps) {
  const { currentSong, onClose, shuffle, repeatMode } = props;
  const colors = useThemeStore((state) => state.colors);

  return (
    <ScrollView
      style={[styles.scrollContainer, { backgroundColor: colors.background }]}
      contentContainerStyle={{ flexGrow: 1 }}
    >
      <View style={styles.playerContainer}>
        <MediaBackground
          videoUrl={currentSong.video_path}
          imageUrl={currentSong.image_path}
        />

        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          testID="close-button"
        >
          <Ionicons name="chevron-down" size={30} color="#fff" />
        </TouchableOpacity>

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.7)", colors.background]}
          locations={[0, 0.5, 1]}
          style={styles.bottomContainer}
        >
          <PlayerControls {...props} colors={colors} />
        </LinearGradient>
      </View>

      <View style={styles.bottomSectionsContainer}>
        {currentSong?.lyrics && (
          <Lyric lyrics={currentSong.lyrics} testID="lyrics-component" />
        )}
        <NextSong repeatMode={repeatMode} shuffle={shuffle} />
        <OnRepeat />
      </View>
    </ScrollView>
  );
}

// カスタム比較関数を使用してメモ化
const MemoizedPlayer = memo(Player, (prevProps, nextProps) => {
  return (
    prevProps.currentSong.id === nextProps.currentSong.id &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.repeatMode === nextProps.repeatMode &&
    prevProps.shuffle === nextProps.shuffle
  );
});
MemoizedPlayer.displayName = "Player";

export default MemoizedPlayer;

const styles = StyleSheet.create({
  bottomSectionsContainer: {
    paddingTop: 16,
    paddingBottom: 32,
    gap: 16,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: "#000",
  },
  playerContainer: {
    height,
    width,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundVideo: {},
  closeButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingHorizontal: 20,
    paddingVertical: 30,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    width: "100%",
  },
  titleContainer: {
    height: 40,
    marginBottom: 5,
  },
  author: {
    color: "#999",
    fontSize: 18,
    marginTop: 5,
  },
  slider: {
    width: "100%",
    height: 40,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: -10,
  },
  timeText: {
    color: "#999",
    fontSize: 12,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
  },
  playButton: {
    transform: [{ scale: 1.2 }],
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  textContainer: {
    flex: 1,
    alignItems: "flex-start",
    width: "55%",
    overflow: "hidden",
  },
  repeatButton: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  repeatModeIndicator: {
    position: "absolute",
    bottom: -8,
    fontSize: 10,
    fontWeight: "bold",
  },
});
