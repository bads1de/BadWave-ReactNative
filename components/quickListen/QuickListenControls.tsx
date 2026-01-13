import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Song from "@/types";

interface QuickListenControlsProps {
  /** 現在の曲 */
  song: Song;
  /** いいねボタン押下時 */
  onLike?: () => void;
  /** プレイリストに追加ボタン押下時 */
  onAddToPlaylist?: () => void;
  /** フルで聴くボタン押下時 */
  onPlayFull?: () => void;
}

/**
 * Quick Listen のアクションボタン群
 * - いいね（ハート）
 * - プレイリストに追加
 * - フルで聴く
 */
function QuickListenControls({
  song,
  onLike,
  onAddToPlaylist,
  onPlayFull,
}: QuickListenControlsProps) {
  return (
    <View style={styles.container}>
      {/* いいねボタン */}
      <TouchableOpacity
        style={styles.button}
        onPress={onLike}
        testID="like-button"
      >
        <BlurView intensity={30} tint="dark" style={styles.blurButton}>
          <MaterialCommunityIcons name="heart-outline" size={24} color="#fff" />
        </BlurView>
      </TouchableOpacity>

      {/* プレイリストに追加ボタン */}
      <TouchableOpacity
        style={styles.button}
        onPress={onAddToPlaylist}
        testID="add-to-playlist-button"
      >
        <BlurView intensity={30} tint="dark" style={styles.blurButton}>
          <MaterialCommunityIcons name="playlist-plus" size={24} color="#fff" />
        </BlurView>
      </TouchableOpacity>

      {/* フルで聴くボタン */}
      <TouchableOpacity
        style={styles.playFullButton}
        onPress={onPlayFull}
        testID="play-full-button"
      >
        <BlurView intensity={40} tint="dark" style={styles.playFullBlur}>
          <MaterialCommunityIcons name="play" size={20} color="#fff" />
          <Text style={styles.playFullText}>フルで聴く</Text>
        </BlurView>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
    paddingVertical: 16,
  },
  button: {
    borderRadius: 24,
    overflow: "hidden",
  },
  blurButton: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  playFullButton: {
    borderRadius: 24,
    overflow: "hidden",
  },
  playFullBlur: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    gap: 8,
  },
  playFullText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default memo(QuickListenControls);
