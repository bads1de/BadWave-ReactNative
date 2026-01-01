import React, { useRef, memo, useCallback, useEffect } from "react";
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Text,
  StatusBar,
  FlatList,
  ViewToken,
} from "react-native";
import { ImageBackground } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import Song from "@/types";
import { useSubPlayerStore } from "@/hooks/useSubPlayerStore";
import { useSubPlayerAudio } from "@/hooks/useSubPlayerAudio";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");

interface SubPlayerProps {
  onClose: () => void;
}

function SubPlayerInner({ onClose }: SubPlayerProps) {
  const songs = useSubPlayerStore((state) => state.songs);
  const currentSongIndex = useSubPlayerStore((state) => state.currentSongIndex);
  const setCurrentSongIndex = useSubPlayerStore(
    (state) => state.setCurrentSongIndex
  );
  const flatListRef = useRef<FlatList<Song>>(null);

  // useSubPlayerAudio フックを使用して再生機能を統合
  const {
    currentPosition,
    duration,
    stopAndUnloadCurrentSound,
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

  const renderItem = useCallback(
    ({ item: song, index }: { item: Song; index: number }) => {
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
            </TouchableOpacity>
          </ImageBackground>
        </View>
      );
    },
    [
      currentSongIndex,
      progressPosition,
      progressDuration,
      togglePlayPause,
      seekTo,
    ]
  );

  const onViewableItemsChanged = useRef(
    async ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const visibleItem = viewableItems[0];
        if (
          visibleItem.index !== null &&
          visibleItem.index !== currentSongIndex
        ) {
          try {
            // 音声を確実に停止して解放
            await stopAndUnloadCurrentSound();
          } catch (error) {
            console.error("Error stopping audio on index change:", error);
          } finally {
            // 確実にインデックスを更新
            setCurrentSongIndex(visibleItem.index);
          }
        }
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const getItemLayout = useCallback(
    (_data: ArrayLike<Song> | null | undefined, index: number) => ({
      length: height,
      offset: height * index,
      index,
    }),
    []
  );

  // 現在の曲インデックスが変更されたら、リストをその位置までスクロールする
  useEffect(() => {
    if (
      flatListRef.current &&
      songs.length > 0 &&
      currentSongIndex >= 0 &&
      currentSongIndex < songs.length
    ) {
      // 既に表示されているインデックスの場合はスクロールしない（手動スワイプ時の競合防止）
      // ただし、初回は必ずスクロール位置を合わせる必要があるため実行する
      // ここでは簡易的に、常にスクロールを実行する（FlatListは同じ位置へのスクロールなら無視または微修正で済むため）
      try {
        flatListRef.current.scrollToIndex({
          index: currentSongIndex,
          animated: true, // アニメーションありで遷移
        });
      } catch (e) {
        console.warn("Scroll to index failed:", e);
      }
    }
  }, [currentSongIndex, songs.length]);

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

      <FlatList
        testID="swiper"
        ref={flatListRef}
        data={songs}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={height}
        snapToAlignment="start"
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={getItemLayout}
        windowSize={3}
        removeClippedSubviews={true}
        initialNumToRender={songs.length}
        maxToRenderPerBatch={2}
        // initialScrollIndexはgetItemLayoutがあれば機能するが、
        // レイアウト計算のタイミングによっては失敗することがあるため、
        // useEffectでのscrollToIndexと併用、もしくはonLayoutで処理するのも手。
        // ここではgetItemLayoutがあるのでinitialScrollIndexを指定してみる
        initialScrollIndex={currentSongIndex}
      />
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

export default memo(SubPlayerInner);
