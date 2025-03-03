import React, { memo, useCallback, useEffect, FC } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
  StyleSheet as RNStyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";
import { ResizeMode, Video } from "expo-av";
import Song from "@/types";
import Lyric from "./lyric";
import LikeButton from "./LikeButton";
import AddPlaylist from "./AddPlaylist";
import { formatTime } from "@/lib/utils";

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
  repeat: boolean;
  repeatMode: "off" | "track" | "queue";
  setRepeat: (value: boolean) => void;
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
  repeat: boolean;
  setRepeat: (value: boolean) => void;
}

interface ControlButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  isActive?: boolean;
  onPress: () => void;
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
      <Text style={styles.title}>{currentSong.title}</Text>
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
    repeat,
    setRepeat,
  }) => (
    <View style={styles.controls}>
      <ControlButton
        icon="shuffle"
        isActive={shuffle}
        onPress={() => setShuffle(!shuffle)}
      />
      <ControlButton icon="play-skip-back" onPress={onPrev} />
      <PlayPauseButton isPlaying={isPlaying} onPress={onPlayPause} />
      <ControlButton icon="play-skip-forward" onPress={onNext} />
      <ControlButton
        icon="repeat"
        isActive={repeat}
        onPress={() => setRepeat(!repeat)}
      />
    </View>
  )
);

const ControlButton: FC<ControlButtonProps> = memo(
  ({ icon, isActive, onPress }) => (
    <TouchableOpacity onPress={onPress}>
      <Ionicons name={icon} size={25} color={isActive ? "#4c1d95" : "#fff"} />
    </TouchableOpacity>
  )
);

const PlayPauseButton: FC<PlayPauseButtonProps> = memo(
  ({ isPlaying, onPress }) => (
    <TouchableOpacity style={styles.playButton} onPress={onPress}>
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
          />
        </View>
      );
    }
    return (
      <ImageBackground
        source={{ uri: imageUrl! }}
        style={styles.backgroundImage}
        resizeMode="cover"
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
    repeat,
    setRepeat,
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
        repeat={repeat}
        setRepeat={setRepeat}
      />
    </>
  )
);

const Player: FC<PlayerProps> = (props) => {
  const { currentSong, onClose, onNext, onPrev } = props;

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

        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
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

      {currentSong?.lyrics && <Lyric lyrics={currentSong.lyrics} />}
    </ScrollView>
  );
};

const MemoizedPlayer = memo(Player);
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
    textAlign: "center",
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
  },
});
