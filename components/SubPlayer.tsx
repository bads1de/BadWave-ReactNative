import React, { useRef, memo } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  StatusBar,
} from "react-native";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import Swiper from "react-native-swiper";
import Song from "@/types";
import { useSubPlayerStore } from "@/hooks/useSubPlayerStore";
import { useSubPlayerAudio } from "@/hooks/useSubPlayerAudio";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

interface SubPlayerProps {
  onClose: () => void;
}

function SubPlayer({ onClose }: SubPlayerProps) {
  const { songs, currentSongIndex, setCurrentSongIndex } = useSubPlayerStore();
  const swiperRef = useRef(null);

  // useSubPlayerAudio フックを使用して再生機能を統合
  const {
    currentPosition,
    duration,
    stopAndUnloadCurrentSound,
    isPlaying,
    togglePlayPause,
    seekTo,
  } = useSubPlayerAudio();

  /**
   * プレーヤーが閉じられるときに音声を確実に停止する処理
   * 改善点: エラーハンドリングの強化とリソース解放の確実性向上
   */
  const handleClose = async () => {
    try {
      // 音声を確実に停止して解放
      await stopAndUnloadCurrentSound();
    } catch (error) {
      // エラーが発生してもクローズ処理を続行
      console.error("Error stopping audio on close:", error);
    } finally {
      // 確実にクローズ処理を実行
      onClose();
    }
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
          style={styles.songImage}
          contentFit="cover"
          cachePolicy="memory-disk"
        >
          <TouchableOpacity
            style={styles.imageOverlay}
            activeOpacity={1}
            onPress={togglePlayPause}
          >
            {/* 上部のグラデーション */}
            <LinearGradient
              colors={["rgba(0,0,0,0.7)", "transparent"]}
              style={styles.topGradient}
            />

            {/* 下部のグラデーション */}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.5)", "rgba(0,0,0,0.9)"]}
              locations={[0.6, 0.8, 1]}
              style={styles.bottomGradient}
            >
              <View style={styles.songInfo}>
                <Text style={styles.songTitle}>{song.title}</Text>
                <Text style={styles.songAuthor}>{song.author}</Text>
              </View>

              {/* プログレスバー */}
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
                    onSlidingComplete={seekTo}
                  />
                </View>
              </View>
            </LinearGradient>

            {/* アクションアイコン */}
            <View style={styles.actionIcons}>
              <TouchableOpacity style={styles.actionButton}>
                <BlurView
                  intensity={30}
                  style={styles.blurIconContainer}
                  tint="dark"
                >
                  <Ionicons
                    name="person-circle-outline"
                    size={28}
                    color="#FF69B4"
                  />
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <BlurView
                  intensity={30}
                  style={styles.blurIconContainer}
                  tint="dark"
                >
                  <Ionicons name="heart-outline" size={28} color="#FF0080" />
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <BlurView
                  intensity={30}
                  style={styles.blurIconContainer}
                  tint="dark"
                >
                  <Ionicons
                    name="chatbubble-outline"
                    size={28}
                    color="#00dbde"
                  />
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <BlurView
                  intensity={30}
                  style={styles.blurIconContainer}
                  tint="dark"
                >
                  <Ionicons
                    name="share-social-outline"
                    size={28}
                    color="#7C3AED"
                  />
                </BlurView>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <BlurView
                  intensity={30}
                  style={styles.blurIconContainer}
                  tint="dark"
                >
                  <Ionicons
                    name="ellipsis-horizontal"
                    size={28}
                    color="#00F5A0"
                  />
                </BlurView>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </ImageBackground>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />
      <BlurView intensity={30} style={styles.closeButtonContainer} tint="dark">
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </BlurView>

      <Swiper
        ref={swiperRef}
        style={styles.wrapper}
        showsPagination={false}
        horizontal={false}
        loop={false}
        index={currentSongIndex}
        onIndexChanged={async (index) => {
          try {
            // 音声を確実に停止して解放
            await stopAndUnloadCurrentSound();
          } catch (error) {
            console.error("Error stopping audio on index change:", error);
          } finally {
            // 確実にインデックスを更新
            setCurrentSongIndex(index);
          }
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
  },
  closeButtonContainer: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 1001,
    borderRadius: 20,
    overflow: "hidden",
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  wrapper: {
    overflow: "visible",
  },
  swiperContainer: {
    height: height,
    overflow: "visible",
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
  slide: {
    height: height,
    width: width,
    overflow: "hidden",
    position: "relative",
  },
  songImage: {
    height: height,
    width: width,
    justifyContent: "space-between",
  },
  topGradient: {
    height: 120,
    width: "100%",
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 2,
  },
  bottomGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.4,
    justifyContent: "flex-end",
    paddingBottom: 50,
    paddingHorizontal: 20,
  },
  songInfo: {
    alignItems: "center",
    marginBottom: 30,
  },
  songTitle: {
    color: "#fff",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  songAuthor: {
    color: "rgba(255, 255, 255, 0.9)",
    fontSize: 20,
    textAlign: "center",
    textShadowColor: "rgba(0, 0, 0, 0.75)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  actionIcons: {
    position: "absolute",
    right: 15,
    bottom: height * 0.3,
    alignItems: "center",
    zIndex: 10,
  },
  actionButton: {
    alignItems: "center",
    marginBottom: 20,
  },
  blurIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  playerControls: {
    width: "100%",
    alignItems: "center",
    marginBottom: 20,
  },
  seekBarContainer: {
    width: "90%",
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
    height: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#4c1d95",
    borderRadius: 2,
  },
  imageOverlay: {
    flex: 1,
    justifyContent: "space-between",
  },
});

export default memo(SubPlayer);
