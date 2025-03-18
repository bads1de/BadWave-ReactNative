import React, { useRef } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ImageBackground,
  Text,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import Swiper from "react-native-swiper";
import Song from "@/types";
import { useSubPlayerStore } from "@/hooks/useSubPlayerStore";

const { width, height } = Dimensions.get("window");
const PREVIEW_HEIGHT = 80; // 前後の曲のプレビュー表示の高さ

interface SubPlayerProps {
  onClose: () => void;
}

export default function SubPlayer({ onClose }: SubPlayerProps) {
  const { songs, currentSongIndex, setCurrentSongIndex } = useSubPlayerStore();
  const swiperRef = useRef(null);

  // ダミーの状態（後で実際の再生機能と置き換え）
  const isPlaying = false;
  const progressPosition = 0;
  const progressDuration = 100;

  const renderSong = (song: Song, index: number) => {
    return (
      <View style={styles.slide} key={song.id}>
        <ImageBackground
          source={{ uri: song.image_path }}
          style={styles.songImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.8)"]}
            style={styles.gradient}
          >
            <View style={styles.songInfo}>
              <Text style={styles.songTitle}>{song.title}</Text>
              <Text style={styles.songAuthor}>{song.author}</Text>
            </View>

            <View style={styles.playerControls}>
              <View style={styles.seekBarContainer}>
                <Slider
                  style={styles.seekBar}
                  minimumValue={0}
                  maximumValue={progressDuration || 1}
                  value={progressPosition}
                  minimumTrackTintColor="#fff"
                  maximumTrackTintColor="rgba(255,255,255,0.3)"
                  thumbTintColor="#fff"
                />
                <Text style={styles.timeText}>00:00</Text>
              </View>

              <TouchableOpacity style={styles.playButton}>
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={30}
                  color="#fff"
                />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="chevron-down" size={30} color="#fff" />
      </TouchableOpacity>

      <Swiper
        ref={swiperRef}
        style={styles.wrapper}
        showsPagination={false}
        loop={false}
        horizontal={false}
        index={currentSongIndex}
        onIndexChanged={(index) => {
          setCurrentSongIndex(index);
          // 後で実際の再生機能を追加
        }}
        containerStyle={styles.swiperContainer}
        scrollEnabled={true}
        bounces={true}
      >
        {songs.map((song, index) => renderSong(song, index))}
      </Swiper>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height,
    backgroundColor: "#000",
    zIndex: 1000,
    overflow: "hidden",
  },
  closeButton: {
    position: "absolute",
    top: 40,
    left: 20,
    zIndex: 1001,
  },
  wrapper: {
    overflow: "visible",
  },
  swiperContainer: {
    height: height,
    overflow: "visible",
  },
  slide: {
    height: height - PREVIEW_HEIGHT * 2,
    marginTop: PREVIEW_HEIGHT,
    marginBottom: PREVIEW_HEIGHT,
    overflow: "visible",
    position: "relative",
  },
  songImage: {
    height: height,
    width: width,
    position: "absolute",
    top: -PREVIEW_HEIGHT,
    left: 0,
    justifyContent: "space-between",
    borderRadius: 0,
  },
  gradient: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
    paddingTop: PREVIEW_HEIGHT + 20,
    paddingBottom: PREVIEW_HEIGHT + 20,
  },
  songInfo: {
    alignItems: "center",
    marginTop: 60 + PREVIEW_HEIGHT,
  },
  songTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  songAuthor: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 18,
    textAlign: "center",
  },
  playerControls: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  seekBarContainer: {
    width: "100%",
    marginBottom: 20,
  },
  seekBar: {
    width: "100%",
    height: 40,
  },
  timeText: {
    color: "#fff",
    fontSize: 12,
    alignSelf: "flex-start",
    marginTop: 5,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
});
