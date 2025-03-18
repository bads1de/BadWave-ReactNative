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
const PREVIEW_HEIGHT = 100;
const BORDER_RADIUS = 20;
const VISIBLE_OFFSET = 40;

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
    const isActive = index === currentSongIndex;
    return (
      <View
        style={[
          styles.slide,
          isActive ? styles.activeSlide : styles.inactiveSlide,
        ]}
        key={song.id}
      >
        <ImageBackground
          source={{ uri: song.image_path }}
          style={[
            styles.songImage,
            isActive ? styles.activeSongImage : styles.inactiveSongImage,
          ]}
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

            {/* アクションアイコン */}
            <View style={styles.actionIcons}>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="play-outline" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="heart-outline" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="chatbubble-outline" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-social-outline" size={28} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="ellipsis-horizontal" size={28} color="#fff" />
              </TouchableOpacity>
            </View>

            <View style={styles.playerControls}>
              <TouchableOpacity style={styles.playButton}>
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={24}
                  color="#fff"
                />
              </TouchableOpacity>
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
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={onClose}>
        <Ionicons name="arrow-back" size={30} color="#fff" />
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
  cardStyle: {
    overflow: "visible",
    borderRadius: BORDER_RADIUS,
  },
  activeSlide: {
    opacity: 1,
    transform: [{ scale: 1 }],
    zIndex: 2,
  },
  inactiveSlide: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
    zIndex: 1,
  },
  activeSongImage: {
    borderRadius: BORDER_RADIUS,
  },
  inactiveSongImage: {
    borderRadius: BORDER_RADIUS / 2,
  },
  slide: {
    height: height - (PREVIEW_HEIGHT * 2 - VISIBLE_OFFSET * 2),
    marginTop: PREVIEW_HEIGHT - VISIBLE_OFFSET,
    marginBottom: PREVIEW_HEIGHT - VISIBLE_OFFSET,
    overflow: "visible",
    position: "relative",
    borderRadius: BORDER_RADIUS,
  },
  songImage: {
    height: height,
    width: width,
    position: "absolute",
    top: -PREVIEW_HEIGHT,
    left: 0,
    justifyContent: "space-between",
    borderRadius: BORDER_RADIUS,
    overflow: "hidden",
  },
  gradient: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
    paddingTop: PREVIEW_HEIGHT + 20,
    paddingBottom: PREVIEW_HEIGHT + 20,
    borderRadius: BORDER_RADIUS,
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
  actionIcons: {
    position: "absolute",
    right: 15,
    bottom: 220,
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
    marginBottom: 35,
  },
  actionText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 5,
  },
  playerControls: {
    width: "90%",
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    alignSelf: "center",
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  seekBarContainer: {
    flex: 1,
    padding: 10,
    justifyContent: "center",
  },
  seekBar: {
    width: "90%",
    height: 30,
  },
  timeText: {
    color: "#fff",
    fontSize: 12,
    alignSelf: "flex-start",
    marginTop: 2,
  },
});
