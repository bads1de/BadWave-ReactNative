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
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { ResizeMode, Video } from "expo-av";
import Song from "@/types";
import NextSong from "./NextSong";
import Lyric from "./lyric";
import LikeButton from "./LikeButton";
import AddPlaylist from "./AddPlaylist";
import MarqueeText from "./MarqueeText";
import { formatTime } from "@/lib/utils";
import { RepeatMode } from "react-native-track-player";
import TopPlayedSongsList from "./TopPlayedSongsList";

/**
 * @fileoverview 音楽プレーヤーのUIコンポーネント
 * このモジュールは、アプリケーションのメインプレーヤーUIを提供します。
 */

/**
 * プレーヤーコンポーネントのプロパティ
 * @interface PlayerProps
 * @property {boolean} isPlaying - 現在の再生状態
 * @property {Song} currentSong - 現在再生中の曲情報
 * @property {number} position - 現在の再生位置（秒）
 * @property {number} duration - 曲の総再生時間（秒）
 * @property {Function} onPlayPause - 再生/一時停止時のコールバック
 * @property {Function} onNext - 次の曲へ移動時のコールバック
 * @property {Function} onPrev - 前の曲へ移動時のコールバック
 * @property {Function} onSeek - シーク時のコールバック
 * @property {Function} onClose - プレーヤーを閉じる時のコールバック
 * @property {RepeatMode} repeatMode - リピートモードの状態
 * @property {Function} setRepeatMode - リピートモード変更時のコールバック
 * @property {boolean} shuffle - シャッフルモードの状態
 * @property {Function} setShuffle - シャッフルモード変更時のコールバック
 */

interface PlayerProps {
  isPlaying: boolean;
  currentSong: Song;
  position: number;
  duration: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (millis: number) => void;
  onClose: () => void;
  repeatMode: RepeatMode.Off | RepeatMode.Track | RepeatMode.Queue;
  setRepeatMode: (
    mode: RepeatMode.Off | RepeatMode.Track | RepeatMode.Queue
  ) => void;
  shuffle: boolean;
  setShuffle: (value: boolean) => void;
}

interface SongInfoProps {
  currentSong: Song;
}

interface ProgressProps {
  position: number;
  duration: number;
  onSeek: (millis: number) => void;
}

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
}

interface ControlButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  isActive?: boolean;
  onPress: () => void;
  repeatMode?: RepeatMode.Off | RepeatMode.Track | RepeatMode.Queue;
  testID?: string;
}

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onPress: () => void;
}

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

const Progress: FC<ProgressProps> = memo(({ position, duration, onSeek }) => (
  <>
    <Slider
      style={styles.slider}
      minimumValue={0}
      maximumValue={duration}
      value={position}
      onSlidingComplete={onSeek}
      minimumTrackTintColor="#4c1d95"
      maximumTrackTintColor="#777"
      thumbTintColor="#4c1d95"
      testID="seek-slider"
    />
    <View style={styles.timeContainer}>
      <Text style={styles.timeText}>{formatTime(position)}</Text>
      <Text style={styles.timeText}>{formatTime(duration)}</Text>
    </View>
  </>
));

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
  }) => (
    <View style={styles.controls}>
      <ControlButton
        icon="shuffle"
        isActive={shuffle}
        onPress={() => setShuffle(!shuffle)}
        testID="shuffle-button"
      />
      <ControlButton
        icon="play-skip-back"
        onPress={onPrev}
        testID="prev-button"
      />
      <PlayPauseButton isPlaying={isPlaying} onPress={onPlayPause} />
      <ControlButton
        icon="play-skip-forward"
        onPress={onNext}
        testID="next-button"
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
      />
    </View>
  )
);

const ControlButton: FC<ControlButtonProps> = memo(
  ({ icon, isActive, onPress, repeatMode, testID }) => {
    // リピートボタンの場合、モードに応じて異なるアイコンを表示
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
              color={isActive ? "#4c1d95" : "#fff"}
            />
            {isActive && (
              <Text style={[styles.repeatModeIndicator, { color: "#4c1d95" }]}>
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
        <Ionicons name={icon} size={25} color={isActive ? "#4c1d95" : "#fff"} />
      </TouchableOpacity>
    );
  }
);

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

const MediaBackground: FC<MediaBackgroundProps> = memo(
  ({ videoUrl, imageUrl }) => {
    if (videoUrl) {
      return (
        <View style={styles.backgroundImage}>
          <Video
            source={{ uri: videoUrl }}
            style={[RNStyleSheet.absoluteFill, styles.backgroundVideo]}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
            testID="background-video"
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

const PlayerControls: FC<PlayerProps> = memo(
  ({
    isPlaying,
    position,
    duration,
    onPlayPause,
    onNext,
    onPrev,
    onSeek,
    shuffle,
    setShuffle,
    repeatMode,
    setRepeatMode,
    currentSong,
  }) => (
    <>
      <SongInfo currentSong={currentSong} />
      <Progress position={position} duration={duration} onSeek={onSeek} />
      <Controls
        isPlaying={isPlaying}
        onPlayPause={onPlayPause}
        onNext={onNext}
        onPrev={onPrev}
        shuffle={shuffle}
        setShuffle={setShuffle}
        repeatMode={repeatMode}
        setRepeatMode={setRepeatMode}
      />
    </>
  )
);

/**
 * メインプレーヤーコンポーネント
 * @description
 * 以下の機能を提供するUIコンポーネントです：
 * - 曲情報の表示（タイトル、アーティスト、アートワーク）
 * - 再生コントロール（再生/一時停止、次へ、前へ）
 * - シークバーによる再生位置制御
 * - リピート/シャッフルモードの切り替え
 * - プレイリストへの追加
 * - いいね機能
 *
 * @example
 * ```tsx
 * <Player
 *   isPlaying={isPlaying}
 *   currentSong={currentSong}
 *   position={position}
 *   duration={duration}
 *   onPlayPause={handlePlayPause}
 *   onNext={handleNext}
 *   onPrev={handlePrev}
 *   onSeek={handleSeek}
 *   onClose={handleClose}
 *   repeatMode={repeatMode}
 *   setRepeatMode={setRepeatMode}
 *   shuffle={shuffle}
 *   setShuffle={setShuffle}
 * />
 * ```
 */
const Player: FC<PlayerProps> = (props) => {
  const { currentSong, onClose, shuffle, repeatMode } = props;

  return (
    <ScrollView
      style={styles.scrollContainer}
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
          colors={["transparent", "rgba(0,0,0,0.7)", "rgba(0,0,0,1)"]}
          locations={[0, 0.5, 1]}
          style={styles.bottomContainer}
        >
          <PlayerControls {...props} />
        </LinearGradient>
      </View>

      {currentSong?.lyrics && (
        <Lyric lyrics={currentSong.lyrics} testID="lyrics-component" />
      )}
      <NextSong repeatMode={repeatMode} shuffle={shuffle} />
      <TopPlayedSongsList />
    </ScrollView>
  );
};

// カスタム比較関数を使用してメモ化
const MemoizedPlayer = memo(Player, (prevProps, nextProps) => {
  return (
    prevProps.currentSong.id === nextProps.currentSong.id &&
    prevProps.isPlaying === nextProps.isPlaying &&
    prevProps.position === nextProps.position &&
    prevProps.duration === nextProps.duration &&
    prevProps.repeatMode === nextProps.repeatMode &&
    prevProps.shuffle === nextProps.shuffle
  );
});

export default MemoizedPlayer;

const styles = StyleSheet.create({
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
