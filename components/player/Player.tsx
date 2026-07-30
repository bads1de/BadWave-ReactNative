import React, { memo, FC } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from "react-native";
import { ImageBackground } from "expo-image";
import {
  Shuffle,
  SkipBack,
  SkipForward,
  Repeat,
  Repeat1,
  Play,
  Pause,
  ChevronDown,
} from "lucide-react-native";
import { LinearGradient } from "expo-linear-gradient";
import { VideoView, useVideoPlayer } from "expo-video";
import Song, { IconComponent } from "@/types";
import { RepeatMode } from "@rntp/player";
import MarqueeText from "@/components/common/MarqueeText";
import AddPlaylist from "@/components/playlist/AddPlaylist";
import LikeButton from "@/components/common/LikeButton";
import Lyric from "@/components/player/lyric";
import NextSong from "@/components/player/NextSong";
import OnRepeat from "@/components/onRepeat/OnRepeat";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { ThemeDefinition } from "@/constants/ThemeColors";
import PlayerProgress from "@/components/player/PlayerProgress";
import { FONTS } from "@/constants/theme";
import { moderateScale } from "react-native-size-matters";

/**
 * @fileoverview 音楽プレーヤーのUIコンポーネント (Full-bleed Stage & Console)
 *
 * イメージ/動画を全画面に敷き、段階的グラデーションの上に
 * 楽曲情報・シーク・操作を集約したコンソールを配置する没入型構成。
 */

interface PlayerProps {
  isPlaying: boolean;
  currentSong: Song;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (millis: number) => void;
  onClose: () => void;
  repeatMode: RepeatMode;
  setRepeatMode: (
    mode: RepeatMode,
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
  repeatMode: RepeatMode;
  setRepeatMode: (
    mode: RepeatMode,
  ) => void;
  colors: ThemeDefinition["colors"];
}

interface ControlButtonProps {
  icon: IconComponent;
  isActive?: boolean;
  onPress: () => void;
  testID?: string;
  activeColor?: string;
  inactiveColor?: string;
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

const PlayerHeader: FC<{ onClose: () => void }> = memo(({ onClose }) => (
  <View style={styles.header}>
    <TouchableOpacity
      style={styles.headerChip}
      onPress={onClose}
      testID="close-button"
      activeOpacity={0.7}
    >
      <ChevronDown size={22} color="#fff" strokeWidth={1.8} />
    </TouchableOpacity>
    <Text style={styles.headerLabel}>NOW PLAYING</Text>
    <View style={styles.headerChipSpacer} />
  </View>
));
PlayerHeader.displayName = "PlayerHeader";

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
        <View style={StyleSheet.absoluteFill} testID="background-video">
          <VideoView
            player={player}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            nativeControls={false}
          />
        </View>
      );
    }

    return (
      <ImageBackground
        source={{ uri: imageUrl! }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    );
  },
);
MediaBackground.displayName = "MediaBackground";

const SongInfo: FC<SongInfoProps> = memo(({ currentSong }) => {
  const colors = useThemeStore((state) => state.colors);
  return (
    <View style={styles.infoContainer}>
      <View style={styles.textContainer}>
        <MarqueeText
          text={currentSong.title}
          style={styles.titleContainer}
          speed={0.5}
          withGesture={false}
          fontSize={24}
          fontFamily={FONTS.bold}
        />
        <Text
          style={[styles.author, { color: colors.subText }]}
          numberOfLines={1}
        >
          {currentSong.author}
        </Text>
      </View>
      <View style={styles.actionButtons}>
        <LikeButton songId={currentSong.id} />
        <View style={{ width: 18 }} />
        <AddPlaylist songId={currentSong.id} />
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
  }) => {
    const accent = colors.primaryLight ?? colors.primary;
    const inactive = "rgba(255, 255, 255, 0.65)";
    return (
      <View style={styles.controls}>
        <ControlButton
          icon={Shuffle}
          isActive={shuffle}
          onPress={() => setShuffle(!shuffle)}
          testID="shuffle-button"
          activeColor={accent}
          inactiveColor={inactive}
        />
        <TouchableOpacity
          onPress={onPrev}
          style={styles.skipButton}
          testID="prev-button"
          activeOpacity={0.7}
        >
          <SkipBack size={30} color="#fff" strokeWidth={1.5} fill="#fff" />
        </TouchableOpacity>
        <PlayPauseButton
          isPlaying={isPlaying}
          onPress={onPlayPause}
          colors={colors}
        />
        <TouchableOpacity
          onPress={onNext}
          style={styles.skipButton}
          testID="next-button"
          activeOpacity={0.7}
        >
          <SkipForward
            size={30}
            color="#fff"
            strokeWidth={1.5}
            fill="#fff"
          />
        </TouchableOpacity>
        <ControlButton
          icon={repeatMode === RepeatMode.One ? Repeat1 : Repeat}
          isActive={repeatMode !== RepeatMode.Off}
          onPress={() => {
            switch (repeatMode) {
              case RepeatMode.Off:
                setRepeatMode(RepeatMode.One);
                break;
              case RepeatMode.One:
                setRepeatMode(RepeatMode.All);
                break;
              case RepeatMode.All:
                setRepeatMode(RepeatMode.Off);
                break;
            }
          }}
          testID="repeat-button"
          activeColor={accent}
          inactiveColor={inactive}
        />
      </View>
    );
  },
);
Controls.displayName = "Controls";

const ControlButton: FC<ControlButtonProps> = memo(
  ({ icon: Icon, isActive, onPress, testID, activeColor, inactiveColor }) => {
    return (
      <TouchableOpacity
        onPress={onPress}
        style={styles.controlButton}
        testID={testID}
        activeOpacity={0.7}
      >
        <Icon
          size={22}
          color={isActive ? activeColor : inactiveColor}
          strokeWidth={isActive ? 2 : 1.4}
        />
        <View
          style={[
            styles.activeDot,
            { backgroundColor: activeColor, opacity: isActive ? 1 : 0 },
          ]}
        />
      </TouchableOpacity>
    );
  },
);
ControlButton.displayName = "ControlButton";

const PlayPauseButton: FC<PlayPauseButtonProps> = memo(
  ({ isPlaying, onPress, colors }) => {
    const accent = colors.primaryLight ?? colors.primary;
    return (
      <TouchableOpacity
        style={[
          styles.playButton,
          {
            backgroundColor: accent,
            shadowColor: accent,
          },
        ]}
        onPress={onPress}
        testID="play-pause-button"
        activeOpacity={0.85}
      >
        {isPlaying ? (
          <Pause size={34} color="#000" fill="#000" />
        ) : (
          <Play size={34} color="#000" fill="#000" style={{ marginLeft: 5 }} />
        )}
      </TouchableOpacity>
    );
  },
);
PlayPauseButton.displayName = "PlayPauseButton";

function Player(props: PlayerProps) {
  const { currentSong, onClose } = props;
  const colors = useThemeStore((state) => state.colors);

  return (
    <ScrollView
      style={[styles.scrollContainer, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.playerContainer}>
        <MediaBackground
          videoUrl={currentSong.video_path}
          imageUrl={currentSong.image_path}
        />

        <LinearGradient
          colors={[
            "rgba(0, 0, 0, 0.35)",
            "transparent",
            "rgba(0, 0, 0, 0.45)",
            "rgba(0, 0, 0, 0.92)",
          ]}
          locations={[0, 0.35, 0.68, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <PlayerHeader onClose={onClose} />

        <View style={styles.console}>
          <SongInfo currentSong={currentSong} />

          <View style={styles.progressContainer}>
            <PlayerProgress onSeek={props.onSeek} />
          </View>

          <Controls
            isPlaying={props.isPlaying}
            onPlayPause={props.onPlayPause}
            onNext={props.onNext}
            onPrev={props.onPrev}
            shuffle={props.shuffle}
            setShuffle={props.setShuffle}
            repeatMode={props.repeatMode}
            setRepeatMode={props.setRepeatMode}
            colors={colors}
          />
        </View>
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
        <NextSong />
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
  scrollContent: {
    flexGrow: 1,
  },
  playerContainer: {
    height: height * 0.92,
    width,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 56,
  },
  headerChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0, 0, 0, 0.35)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerChipSpacer: {
    width: 38,
  },
  headerLabel: {
    fontSize: 11,
    fontFamily: FONTS.semibold,
    letterSpacing: 3,
    color: "rgba(255, 255, 255, 0.65)",
  },
  console: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
    justifyContent: "center",
  },
  titleContainer: {
    height: 32,
    marginBottom: 2,
  },
  author: {
    fontSize: 15,
    fontFamily: FONTS.body,
    opacity: 0.9,
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  progressContainer: {
    marginTop: 20,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 4,
  },
  controlButton: {
    width: moderateScale(46),
    height: moderateScale(46),
    justifyContent: "center",
    alignItems: "center",
  },
  activeDot: {
    position: "absolute",
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  skipButton: {
    width: moderateScale(52),
    height: moderateScale(52),
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: moderateScale(78),
    height: moderateScale(78),
    borderRadius: moderateScale(39),
    justifyContent: "center",
    alignItems: "center",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
    elevation: 10,
  },
  bottomSectionsContainer: {
    paddingTop: 8,
    paddingBottom: 64,
    paddingHorizontal: 20,
    gap: 28,
  },
});
