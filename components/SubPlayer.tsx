import React, { useRef, useEffect } from "react";
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
import { useSubPlayerAudio } from "@/hooks/useSubPlayerAudio";

const { width, height } = Dimensions.get("window");
const PREVIEW_HEIGHT = 80;
const BORDER_RADIUS = 20;
const VISIBLE_OFFSET = 30;

interface SubPlayerProps {
  onClose: () => void;
}

export default function SubPlayer({ onClose }: SubPlayerProps) {
  const { songs, currentSongIndex, setCurrentSongIndex } = useSubPlayerStore();
  const swiperRef = useRef(null);

  // useSubPlayerAudio フックを使用して再生機能を統合
  const { currentPosition, duration, stopAndUnloadCurrentSound } =
    useSubPlayerAudio();

  // プレーヤーが閉じられるときに音声を停止
  const handleClose = () => {
    stopAndUnloadCurrentSound()
      .then(() => {
        onClose();
      })
      .catch((error) => {
        console.error("Error stopping audio on close:", error);
        onClose();
      });
  };

  // 進捗情報（ミリ秒）
  const progressPosition = currentPosition;
  const progressDuration = duration;

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
                <View style={styles.userIconContainer}>
                  <Ionicons
                    name="person-circle-outline"
                    size={36}
                    color="#fff"
                  />
                </View>
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
              <View style={styles.seekBarContainer}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${
                          (progressPosition / (progressDuration || 1)) * 100
                        }%`,
                      },
                    ]}
                  />
                </View>
                <Slider
                  style={styles.seekBar}
                  minimumValue={0}
                  maximumValue={progressDuration || 1}
                  value={progressPosition}
                  minimumTrackTintColor="transparent"
                  maximumTrackTintColor="transparent"
                  thumbTintColor="transparent"
                />
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
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
          stopAndUnloadCurrentSound()
            .then(() => {
              setCurrentSongIndex(index);
            })
            .catch((error) => {
              setCurrentSongIndex(index);
            });
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
    paddingTop: PREVIEW_HEIGHT + 10,
    paddingBottom: PREVIEW_HEIGHT - 40,
    borderRadius: BORDER_RADIUS,
  },
  songInfo: {
    alignItems: "center",
    marginTop: height * 0.15,
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
    bottom: height * 0.25,
    alignItems: "center",
  },
  actionButton: {
    alignItems: "center",
    marginBottom: 25,
  },
  userIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 5,
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
    marginBottom: 30,
    alignSelf: "center",
    position: "absolute",
    bottom: 50,
    left: "5%",
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
    position: "relative",
  },
  seekBar: {
    width: "100%",
    height: 40,
    position: "absolute",
    top: 0,
    left: 0,
    zIndex: 2,
    opacity: 0.01,
  },
  progressBarBackground: {
    width: "100%",
    height: 12,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 6,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#fff",
    borderRadius: 6,
  },
  timeText: {
    color: "#fff",
    fontSize: 12,
    alignSelf: "flex-start",
    marginTop: 2,
  },
});
