import React, { memo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Song from "@/types";
import AddPlaylist from "@/components/playlist/AddPlaylist";
import LikeButton from "@/components/LikeButton";

interface OnRepeatPlayerControlsProps {
  /** 現在の曲 */
  song: Song;
  /** フルで聴くボタン押下時 */
  onPlayFull?: () => void;
}

/**
 * OnRepeat Player のアクションボタン群
 * - いいね（ハート）
 * - プレイリストに追加
 * - フルで聴く
 */
function OnRepeatPlayerControls({
  song,
  onPlayFull,
}: OnRepeatPlayerControlsProps) {
  return (
    <View style={styles.container}>
      {/* いいねボタン */}
      <View style={styles.button}>
        <View style={styles.blurButton}>
          <LikeButton songId={song.id} size={24} />
        </View>
      </View>

      {/* プレイリストに追加ボタン */}
      <AddPlaylist songId={song.id}>
        <View style={styles.button}>
          <View style={styles.blurButton}>
            <MaterialCommunityIcons
              name="playlist-plus"
              size={24}
              color="#fff"
            />
          </View>
        </View>
      </AddPlaylist>

      {/* フルで聴くボタン */}
      <TouchableOpacity
        style={styles.playFullButton}
        onPress={onPlayFull}
        testID="play-full-button"
      >
        <View style={styles.playFullBlur}>
          <MaterialCommunityIcons name="play" size={20} color="#fff" />
          <Text style={styles.playFullText}>フルで聴く</Text>
        </View>
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
    backgroundColor: "rgba(0,0,0,0.4)",
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
    backgroundColor: "rgba(0,0,0,0.4)",
  },
  playFullText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default memo(OnRepeatPlayerControls);
