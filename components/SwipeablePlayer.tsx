import React, { useEffect, useRef, useState } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  PanResponder,
  Animated,
  TouchableOpacity,
  ImageBackground,
  Text,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import { formatTime } from "@/lib/utils";
import Song from "@/types";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

const { width, height } = Dimensions.get("window");
const SWIPE_THRESHOLD = 80; // スワイプの閾値を下げて操作性向上
const PREVIEW_HEIGHT = 50; // 前後の曲のプレビュー表示の高さ

interface SwipeablePlayerProps {
  currentSong: Song;
  prevSong?: Song;
  nextSong?: Song;
  isVisible: boolean;
  onClose: () => void;
}

export default function SwipeablePlayer({
  currentSong,
  prevSong,
  nextSong,
  isVisible,
  onClose,
}: SwipeablePlayerProps) {
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(isVisible ? 1 : 0)).current;
  const [activeSong, setActiveSong] = useState(currentSong);
  const [direction, setDirection] = useState<"none" | "up" | "down">("none");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const {
    isPlaying,
    togglePlayPause,
    playNextSong,
    playPrevSong,
    seekTo,
    progressPosition,
    progressDuration,
  } = useAudioPlayer();

  // 曲が変わったら状態を更新
  useEffect(() => {
    if (!isTransitioning) {
      setActiveSong(currentSong);
    }
  }, [currentSong, isTransitioning]);

  // 表示状態が変更されたときのアニメーション
  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isVisible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (!isVisible) {
        translateY.setValue(0);
        setDirection("none");
      }
    });
  }, [isVisible, opacity]);

  // 曲を切り替える関数
  const switchToPrevSong = () => {
    if (!prevSong) return;

    setIsTransitioning(true);
    setDirection("up");

    Animated.timing(translateY, {
      toValue: -height,
      duration: 300,
      useNativeDriver: true,
    }).start(async () => {
      await playPrevSong();
      setActiveSong(prevSong);
      translateY.setValue(0);
      setDirection("none");
      setIsTransitioning(false);
    });
  };

  const switchToNextSong = () => {
    if (!nextSong) return;

    setIsTransitioning(true);
    setDirection("down");

    Animated.timing(translateY, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(async () => {
      await playNextSong();
      setActiveSong(nextSong);
      translateY.setValue(0);
      setDirection("none");
      setIsTransitioning(false);
    });
  };

  // スワイプ処理のためのPanResponderを設定
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // 垂直方向の移動量が水平方向より大きい場合のみ反応
        return (
          Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
          Math.abs(gestureState.dy) > 10
        );
      },
      onPanResponderGrant: () => {
        // ドラッグ開始時に現在の位置を保存
        translateY.extractOffset();
        translateY.setValue(0);
      },
      onPanResponderMove: (_, gestureState) => {
        // 上下方向のスワイプに応じて位置を更新
        // 上方向のスワイプは前の曲がある場合のみ
        if (gestureState.dy < 0 && !prevSong) {
          translateY.setValue(gestureState.dy * 0.5); // 抵抗感を出すために移動量を半分に
        }
        // 下方向のスワイプは次の曲がある場合のみ
        else if (gestureState.dy > 0 && !nextSong) {
          translateY.setValue(gestureState.dy * 0.5); // 抵抗感を出すために移動量を半分に
        } else {
          translateY.setValue(gestureState.dy);
        }

        // スワイプ方向を更新
        if (gestureState.dy < 0) {
          setDirection("up");
        } else if (gestureState.dy > 0) {
          setDirection("down");
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        // オフセットをリセット
        translateY.flattenOffset();

        // スワイプの閾値を超えた場合、前/次の曲に切り替え
        if (gestureState.dy < -SWIPE_THRESHOLD && prevSong) {
          // 上にスワイプして前の曲へ
          Animated.timing(translateY, {
            toValue: -height,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            playPrevSong();
            translateY.setValue(0);
          });
        } else if (gestureState.dy > SWIPE_THRESHOLD && nextSong) {
          // 下にスワイプして次の曲へ
          Animated.timing(translateY, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
          }).start(() => {
            playNextSong();
            translateY.setValue(0);
          });
        } else if (gestureState.dy > height / 3) {
          // 下に大きくスワイプしてプレイヤーを閉じる
          Animated.timing(translateY, {
            toValue: height,
            duration: 300,
            useNativeDriver: true,
          }).start(onClose);
        } else {
          // 閾値未満の場合は元の位置に戻る
          Animated.spring(translateY, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!activeSong) return null;

  // 前の曲のアニメーション位置を計算
  const prevSongPosition =
    direction === "up"
      ? {
          transform: [
            {
              translateY: translateY.interpolate({
                inputRange: [-height, 0],
                outputRange: [-height + PREVIEW_HEIGHT, 0],
                extrapolate: "clamp",
              }),
            },
          ],
        }
      : null;

  // 次の曲のアニメーション位置を計算
  const nextSongPosition =
    direction === "down"
      ? {
          transform: [
            {
              translateY: translateY.interpolate({
                inputRange: [0, height],
                outputRange: [0, height - PREVIEW_HEIGHT],
                extrapolate: "clamp",
              }),
            },
          ],
        }
      : null;

  // 現在の曲のアニメーション
  const currentSongScale = translateY.interpolate({
    inputRange: [-height / 2, 0, height / 2],
    outputRange: [0.95, 1, 0.95],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity,
          zIndex: 999,
        },
      ]}
    >
      <View style={styles.songsContainer} {...panResponder.panHandlers}>
        {/* 前の曲（少しだけ見える） */}
        {prevSong && (
          <Animated.View style={[styles.prevSongContainer, prevSongPosition]}>
            <ImageBackground
              source={{ uri: prevSong.image_path }}
              style={styles.prevSongImage}
              resizeMode="cover"
              imageStyle={styles.roundedImage}
            >
              <LinearGradient
                colors={["rgba(0,0,0,0.5)", "rgba(0,0,0,0.8)"]}
                style={styles.prevSongGradient}
              >
                <View style={styles.prevSongInfo}>
                  <Text style={styles.prevSongTitle}>{prevSong.title}</Text>
                  <Text style={styles.prevSongArtist}>{prevSong.author}</Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </Animated.View>
        )}

        {/* 現在の曲（メイン表示） */}
        <Animated.View
          style={[
            styles.currentSongContainer,
            { transform: [{ translateY }, { scale: currentSongScale }] },
          ]}
        >
          <ImageBackground
            source={{ uri: activeSong.image_path }}
            style={styles.currentSongImage}
            resizeMode="cover"
            imageStyle={styles.roundedImage}
          >
            <LinearGradient
              colors={["rgba(0,0,0,0.3)", "rgba(0,0,0,0.7)"]}
              style={styles.currentSongGradient}
            >
              {/* 曲情報 */}
              <View style={styles.headerContainer}>
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="chevron-down" size={30} color="#fff" />
                </TouchableOpacity>
                <View style={styles.songInfoContainer}>
                  <Text style={styles.songTitle}>{activeSong.title}</Text>
                  <Text style={styles.artistName}>{activeSong.author}</Text>
                </View>
              </View>

              {/* コンテンツボタン */}
              <View style={styles.actionButtons}>
                {/* アクションボタンを右寄せに配置 */}
                <View style={styles.rightAlignedButtons}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="thumbs-up" size={24} color="#fff" />
                    <Text style={styles.likeCount}>2k</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="thumbs-down" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons name="share-social" size={24} color="#fff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons
                      name="chatbubble-ellipses"
                      size={24}
                      color="#fff"
                    />
                    <Text style={styles.commentCount}>138</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <Ionicons
                      name="ellipsis-horizontal"
                      size={24}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* プレイヤーコントロール */}
              <View style={styles.playerControls}>
                {/* シークバー */}
                <View style={styles.seekBarContainer}>
                  <View style={styles.progressBarContainer}>
                    <View
                      style={[
                        styles.progressBar,
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
                    onSlidingComplete={seekTo}
                    minimumTrackTintColor="transparent"
                    maximumTrackTintColor="transparent"
                    thumbTintColor="#fff"
                  />
                  <View style={styles.timeContainer}>
                    <Text style={styles.timeText}>
                      {formatTime(progressPosition)}
                    </Text>
                  </View>
                </View>

                {/* 再生コントロール */}
                <View style={styles.controlButtons}>
                  <TouchableOpacity
                    style={styles.playButton}
                    onPress={() => togglePlayPause()}
                  >
                    <Ionicons
                      name={isPlaying ? "pause" : "play"}
                      size={30}
                      color="#fff"
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </Animated.View>

        {/* 次の曲（少しだけ見える） */}
        {nextSong && (
          <Animated.View style={[styles.nextSongContainer, nextSongPosition]}>
            <ImageBackground
              source={{ uri: nextSong.image_path }}
              style={styles.nextSongImage}
              resizeMode="cover"
              imageStyle={styles.roundedImage}
            >
              <LinearGradient
                colors={["rgba(0,0,0,0.8)", "rgba(0,0,0,0.5)"]}
                style={styles.nextSongGradient}
              >
                <View style={styles.nextSongInfo}>
                  <Text style={styles.nextSongTitle}>{nextSong.title}</Text>
                  <Text style={styles.nextSongArtist}>{nextSong.author}</Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </Animated.View>
        )}
      </View>
    </Animated.View>
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
  },
  songsContainer: {
    flex: 1,
  },
  // 角丸のスタイル
  roundedImage: {
    borderRadius: 20,
    overflow: "hidden",
  },
  // 前の曲のスタイル
  prevSongContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width,
    height: PREVIEW_HEIGHT,
    zIndex: 1,
    paddingHorizontal: 10,
    paddingTop: 5,
  },
  prevSongImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    bottom: 0,
  },
  prevSongGradient: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 8,
    borderRadius: 20,
  },
  prevSongInfo: {
    justifyContent: "flex-end",
  },
  prevSongTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  prevSongArtist: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
  // 現在の曲のスタイル
  currentSongContainer: {
    position: "absolute",
    top: PREVIEW_HEIGHT,
    left: 0,
    width,
    height: height - PREVIEW_HEIGHT * 2,
    zIndex: 2,
    paddingHorizontal: 10,
  },
  currentSongImage: {
    width: "100%",
    height: "100%",
  },
  currentSongGradient: {
    flex: 1,
    justifyContent: "space-between",
    padding: 20,
    borderRadius: 20,
  },
  headerContainer: {
    marginTop: 30,
  },
  closeButton: {
    alignSelf: "flex-start",
    marginBottom: 20,
  },
  songInfoContainer: {
    alignItems: "center",
    marginBottom: 20,
  },
  songTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  artistName: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 18,
    textAlign: "center",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 20,
  },
  rightAlignedButtons: {
    flexDirection: "column",
    alignItems: "center",
    gap: 16,
  },
  actionButton: {
    alignItems: "center",
    marginBottom: 8,
  },
  likeCount: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  commentCount: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
  },
  // プレイヤーコントロール
  playerControls: {
    width: "100%",
    paddingBottom: 20,
  },
  seekBarContainer: {
    width: "100%",
    marginBottom: 10,
  },
  progressBarContainer: {
    position: "absolute",
    height: 4,
    width: "100%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    borderRadius: 2,
    top: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#fff",
    borderRadius: 2,
  },
  seekBar: {
    width: "100%",
    height: 20,
  },
  timeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  timeText: {
    color: "#fff",
    fontSize: 12,
  },
  controlButtons: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  playButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  // 次の曲のスタイル
  nextSongContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width,
    height: PREVIEW_HEIGHT,
    zIndex: 1,
    paddingHorizontal: 10,
    paddingBottom: 5,
  },
  nextSongImage: {
    width: "100%",
    height: "100%",
    position: "absolute",
    top: 0,
  },
  nextSongGradient: {
    flex: 1,
    justifyContent: "flex-start",
    padding: 8,
    borderRadius: 20,
  },
  nextSongInfo: {
    justifyContent: "flex-start",
  },
  nextSongTitle: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  nextSongArtist: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
  },
});
