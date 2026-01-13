import React, { useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useQuickListenStore } from "@/hooks/stores/useQuickListenStore";
import QuickListenList from "./QuickListenList";
import TrackPlayer from "react-native-track-player";
import { usePlayerStore } from "@/hooks/stores/usePlayerStore";

/**
 * Quick Listen のメイン画面
 * 全画面モーダルとして表示され、曲のプレビューを提供
 */
export default function QuickListenScreen() {
  const isVisible = useQuickListenStore((state) => state.isVisible);
  const songs = useQuickListenStore((state) => state.songs);
  const currentIndex = useQuickListenStore((state) => state.currentIndex);
  const setCurrentIndex = useQuickListenStore((state) => state.setCurrentIndex);
  const close = useQuickListenStore((state) => state.close);

  const setShowPlayer = usePlayerStore((state) => state.setShowPlayer);
  const setCurrentSong = usePlayerStore((state) => state.setCurrentSong);

  // 画面を閉じる
  const handleClose = useCallback(() => {
    close();
  }, [close]);

  // インデックス変更（スワイプ時）
  const handleIndexChange = useCallback(
    (index: number) => {
      setCurrentIndex(index);
    },
    [setCurrentIndex]
  );

  // フルで聴く
  const handlePlayFull = useCallback(async () => {
    const currentSong = songs[currentIndex];
    if (!currentSong) return;

    try {
      // Quick Listen を閉じる
      close();

      // メインプレイヤーで再生
      await TrackPlayer.reset();
      await TrackPlayer.add({
        id: currentSong.id,
        url: currentSong.song_path,
        title: currentSong.title,
        artist: currentSong.author,
        artwork: currentSong.image_path,
      });
      await TrackPlayer.play();

      setCurrentSong(currentSong);
      setShowPlayer(true);
    } catch (error) {
      console.error("Error playing full song:", error);
    }
  }, [songs, currentIndex, close, setCurrentSong, setShowPlayer]);

  // 非表示の場合は何も表示しない
  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container} testID="quick-listen-screen">
      <StatusBar
        barStyle="light-content"
        translucent
        backgroundColor="transparent"
      />

      {/* 閉じるボタン */}
      <BlurView intensity={30} style={styles.closeButtonContainer} tint="dark">
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
          testID="close-button"
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
      </BlurView>

      {/* 曲リスト */}
      <QuickListenList
        songs={songs}
        currentIndex={currentIndex}
        onIndexChange={handleIndexChange}
        isParentFocused={isVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
});
