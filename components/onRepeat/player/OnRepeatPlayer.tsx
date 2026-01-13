import React, { useCallback } from "react";
import { View, StyleSheet, TouchableOpacity, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { useOnRepeatStore } from "@/hooks/stores/useOnRepeatStore";
import OnRepeatPlayerList from "./OnRepeatPlayerList";

/**
 * OnRepeat Player のメイン画面
 * 全画面モーダルとして表示され、曲のプレビューを提供
 */
export default function OnRepeatPlayer() {
  const isVisible = useOnRepeatStore((state) => state.isVisible);
  const songs = useOnRepeatStore((state) => state.songs);
  const currentIndex = useOnRepeatStore((state) => state.currentIndex);
  const setCurrentIndex = useOnRepeatStore((state) => state.setCurrentIndex);
  const close = useOnRepeatStore((state) => state.close);

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

  // 非表示の場合は何も表示しない
  if (!isVisible) {
    return null;
  }

  return (
    <View style={styles.container} testID="on-repeat-player">
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
      <OnRepeatPlayerList
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

