import React from "react";
import { TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Song from "@/types";
import {
  useDownloadStatus,
  useDownloadSong,
  useDeleteDownloadedSong,
} from "@/hooks/useDownloadStatus";

interface DownloadButtonProps {
  song: Song;
  size?: number;
  color?: string;
  style?: object;
}

/**
 * 曲のダウンロード/削除ボタンコンポーネント
 * 曲がダウンロード済みかどうかによって表示を切り替える
 */
export function DownloadButton({
  song,
  size = 24,
  color = "white",
  style = {},
}: DownloadButtonProps) {
  // ダウンロード状態を取得
  const { data: isDownloaded = false, isLoading: isStatusLoading } =
    useDownloadStatus(song.id);

  // ダウンロード/削除ミューテーション
  const downloadMutation = useDownloadSong();
  const deleteMutation = useDeleteDownloadedSong();

  // ローディング状態
  const isLoading =
    isStatusLoading ||
    (downloadMutation && downloadMutation.isPending) ||
    (deleteMutation && deleteMutation.isPending);

  // ダウンロード処理
  const handleDownload = () => {
    downloadMutation.mutate(song);
  };

  // 削除処理
  const handleDelete = () => {
    deleteMutation.mutate(song.id);
  };

  // ローディング中
  if (isLoading) {
    return (
      <ActivityIndicator
        testID="loading-indicator"
        size="small"
        color={color}
        style={[styles.button, style]}
      />
    );
  }

  // ダウンロード済み
  if (isDownloaded) {
    return (
      <TouchableOpacity
        testID="delete-button"
        onPress={handleDelete}
        style={[styles.button, style]}
      >
        <Ionicons name="cloud-done" size={size} color={color} />
      </TouchableOpacity>
    );
  }

  // 未ダウンロード
  return (
    <TouchableOpacity
      testID="download-button"
      onPress={handleDownload}
      style={[styles.button, style]}
    >
      <Ionicons name="cloud-download-outline" size={size} color={color} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
