import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { LinearGradient } from "expo-linear-gradient";

interface PlayerProps {
  sound: any;
  isPlaying: boolean;
  currentSong: any;
  position: number;
  duration: number;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (millis: number) => void;
  onClose: () => void;
  repeat: boolean;
  setRepeat: (value: boolean) => void;
  shuffle: boolean;
  setShuffle: (value: boolean) => void;
}

export default function Player({
  isPlaying,
  currentSong,
  position,
  duration,
  onPlayPause,
  onNext,
  onPrev,
  onSeek,
  onClose,
  repeat,
  setRepeat,
  shuffle,
  setShuffle,
}: PlayerProps) {
  const formatTime = (millis: number) => {
    const minutes = Math.floor(millis / 60000);
    const seconds = ((millis % 60000) / 1000).toFixed(0);
    return `${minutes}:${Number(seconds) < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <ImageBackground
      source={currentSong.image_path}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="chevron-down" size={30} color="#fff" />
      </TouchableOpacity>

      <LinearGradient
        colors={["transparent", "rgba(0,0,0,0.7)", "rgba(0,0,0,1)"]}
        locations={[0, 0.5, 1]}
        style={styles.bottomContainer}
      >
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{currentSong.title}</Text>
          <Text style={styles.author}>{currentSong.author}</Text>
        </View>

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

        <View style={styles.controls}>
          <TouchableOpacity onPress={() => setShuffle(!shuffle)}>
            <Ionicons
              name="shuffle"
              size={25}
              color={shuffle ? "#4c1d95" : "#fff"}
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={onPrev}>
            <Ionicons name="play-skip-back" size={35} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.playButton} onPress={onPlayPause}>
            <Ionicons
              name={isPlaying ? "pause-circle" : "play-circle"}
              size={70}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity onPress={onNext}>
            <Ionicons name="play-skip-forward" size={35} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setRepeat(!repeat)}>
            <Ionicons
              name="repeat"
              size={25}
              color={repeat ? "#4c1d95" : "#fff"}
            />
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  },
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
  infoContainer: {
    alignItems: "center",
    marginBottom: 20,
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
});
