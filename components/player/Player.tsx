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
import {
  Shuffle,
  SkipBack,
  SkipForward,
  Repeat,
  Play,
  Pause,
  ChevronDown,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import Song from "@/types";
import { RepeatMode } from "react-native-track-player";
import MarqueeText from "@/components/common/MarqueeText";
import AddPlaylist from "@/components/playlist/AddPlaylist";
import LikeButton from "@/components/LikeButton";
import Lyric from "@/components/player/lyric";
import NextSong from "@/components/player/NextSong";
import OnRepeat from "@/components/onRepeat/OnRepeat";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { ThemeDefinition } from "@/constants/ThemeColors";
import PlayerProgress from "@/components/player/PlayerProgress";
import { FONTS } from "@/constants/theme";

/**
 * @fileoverview 音楽プレーヤーのUIコンポーネント (Badwave Refined)
 */

interface PlayerProps {
  isPlaying: boolean;
  currentSong: Song;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (millis: number) => void;
  onClose: () => void;
  repeatMode: RepeatMode.Off | RepeatMode.Track | RepeatMode.Queue;
  setRepeatMode: (
    mode: RepeatMode.Off | RepeatMode.Track | RepeatMode.Queue,
  ) => void;
  shuffle: boolean;
  setShuffle: (value: boolean) => void;
}

interface SongInfoProps {
  currentSong: Song;
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
    mode: RepeatMode.Off | RepeatMode.Track | RepeatMode.Queue,
  ) => void;
  colors: ThemeDefinition["colors"];
}

interface ControlButtonProps {
  icon: any;
  isActive?: boolean;
  onPress: () => void;
  repeatMode?: RepeatMode.Off | RepeatMode.Track | RepeatMode.Queue;
  testID?: string;
  activeColor?: string;
}

interface PlayPauseButtonProps {
  isPlaying: boolean;
  onPress: () => void;
  colors: ThemeDefinition["colors"];
}

interface MediaBackgroundProps {
  videoUrl?: string | null;
  imageUrl?: string | null;
}

const { width, height } = Dimensions.get("window");

const SongInfo: FC<SongInfoProps> = memo(({ currentSong }) => {
  const { colors } = useThemeStore();
  return (
    <View style={styles.infoContainer}>
      <View style={styles.textContainer}>
        <MarqueeText
          text={currentSong.title}
          style={styles.titleContainer}
          speed={0.5}
          withGesture={false}
          fontSize={24}
        />
        <Text
          style={[styles.author, { color: colors.subText }]}
          numberOfLines={1}
        >
          {currentSong.author}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <AddPlaylist songId={currentSong.id} />
        <View style={{ width: 16 }} />
        <LikeButton songId={currentSong.id} />
      </View>
    </View>
  );
});
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
        icon={Shuffle}
        isActive={shuffle}
        onPress={() => setShuffle(!shuffle)}
        testID="shuffle-button"
        activeColor={colors.primary}
      />
      <ControlButton
        icon={SkipBack}
        onPress={onPrev}
        testID="prev-button"
        activeColor={colors.primary}
      />
      <PlayPauseButton
        isPlaying={isPlaying}
        onPress={onPlayPause}
        colors={colors}
      />
      <ControlButton
        icon={SkipForward}
        onPress={onNext}
        testID="next-button"
        activeColor={colors.primary}
      />
      <ControlButton
        icon={Repeat}
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
  ),
);
Controls.displayName = "Controls";

const ControlButton: FC<ControlButtonProps> = memo(
  ({ icon: Icon, isActive, onPress, repeatMode, testID, activeColor }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={styles.controlButton}
        testID={testID}
      >
        <Icon
          size={24}
          color={isActive ? activeColor : "#fff"}
          strokeWidth={1.2}
        />
        {Icon === Repeat && isActive && (
          <Text style={[styles.repeatModeIndicator, { color: activeColor }]}>
            {repeatMode === RepeatMode.Track ? "1" : ""}
          </Text>
        )}
      </TouchableOpacity>
    );
  },
);
ControlButton.displayName = "ControlButton";

const PlayPauseButton: FC<PlayPauseButtonProps> = memo(
  ({ isPlaying, onPress, colors }) => (
    <TouchableOpacity
      style={[
        styles.playButton,
        {
          backgroundColor: colors.primary,
        },
      ]}
      onPress={onPress}
      testID="play-pause-button"
      activeOpacity={0.8}
    >
      {isPlaying ? (
        <Pause size={32} color="#000" fill="#000" />
      ) : (
        <Play size={32} color="#000" fill="#000" style={{ marginLeft: 4 }} />
      )}
    </TouchableOpacity>
  ),
);
PlayPauseButton.displayName = "PlayPauseButton";

const MediaBackground: FC<MediaBackgroundProps> = memo(
  ({ videoUrl, imageUrl }) => {
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
  },
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

        <View style={styles.progressContainer}>
          <PlayerProgress onSeek={onSeek} />
        </View>

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
    ),
  );
PlayerControls.displayName = "PlayerControls";

function Player(props: PlayerProps) {
  const { currentSong, onClose, shuffle, repeatMode } = props;
  const colors = useThemeStore((state) => state.colors);

  return (
    <ScrollView
      style={[styles.scrollContainer, { backgroundColor: colors.background }]}
      contentContainerStyle={{ flexGrow: 1 }}
      showsVerticalScrollIndicator={false}
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
          <ChevronDown size={32} color="#fff" strokeWidth={1.5} />
        </TouchableOpacity>

        <LinearGradient
          colors={["transparent", "rgba(10, 10, 10, 0.6)", "#0A0A0A"]}
          locations={[0, 0.4, 1]}
          style={styles.bottomContainer}
        >
          <PlayerControls {...props} colors={colors} />
        </LinearGradient>
      </View>

      <View style={styles.bottomSectionsContainer}>
        {currentSong?.lyrics && (
          <Lyric
            lyrics={currentSong.lyrics}
            songTitle={currentSong.title}
            artistName={currentSong.author}
            testID="lyrics-component"
          />
        )}
        <NextSong repeatMode={repeatMode} shuffle={shuffle} />
        <OnRepeat />
      </View>
    </ScrollView>
  );
}

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
  scrollContainer: {
    flex: 1,
  },
  playerContainer: {
    height: height * 0.9,
    width,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  backgroundVideo: {},
  closeButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
  },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    paddingHorizontal: 32,
    paddingVertical: 40,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
    justifyContent: "center",
  },
  titleContainer: {
    height: 38,
    marginBottom: 4,
  },
  author: {
    fontSize: 16,
    fontFamily: FONTS.body,
    opacity: 0.8,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressContainer: {
    marginVertical: 12, // Reduced to tighten layout
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 8,
  },
  controlButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  repeatModeIndicator: {
    position: "absolute",
    bottom: 2,
    right: 4,
    fontSize: 10,
    fontFamily: FONTS.bold,
  },
  bottomSectionsContainer: {
    paddingTop: 16,
    paddingBottom: 64,
    paddingHorizontal: 16,
    gap: 24, // Reduces the excessive space between sections
  },
});
