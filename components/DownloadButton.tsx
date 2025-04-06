import React, { useEffect, useState } from "react";
import { TouchableOpacity, ActivityIndicator, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Song from "../types";
import { getOfflineStorageService } from "../hooks/TrackPlayer/utils";

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
  const [isDownloaded, setIsDownloaded] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // マウント時に曲がダウンロード済みかチェック
  useEffect(() => {
    checkDownloadStatus();
  }, [song.id]);

  // ダウンロード状態をチェック
  const checkDownloadStatus = async () => {
    try {
      const offlineStorageService = getOfflineStorageService();
      const downloaded = await offlineStorageService.isSongDownloaded(song.id);
      setIsDownloaded(downloaded);
    } catch (error) {
      console.error("Failed to check download status:", error);
    }
  };

  // 曲をダウンロード
  const handleDownload = async () => {
    try {
      setIsLoading(true);
      const offlineStorageService = getOfflineStorageService();
      const result = await offlineStorageService.downloadSong(song);

      if (result.success) {
        setIsDownloaded(true);
      } else {
        console.error("Download failed:", result.error);
      }
    } catch (error) {
      console.error("Error downloading song:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // ダウンロードした曲を削除
  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const offlineStorageService = getOfflineStorageService();
      const result = await offlineStorageService.deleteSong(song.id);

      if (result.success) {
        setIsDownloaded(false);
      } else {
        console.error("Delete failed:", result.error);
      }
    } catch (error) {
      console.error("Error deleting song:", error);
    } finally {
      setIsLoading(false);
    }
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
