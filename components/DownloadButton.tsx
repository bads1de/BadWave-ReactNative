import React, { useEffect, useState } from "react";
import {
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Text,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Platform } from "react-native";
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
    console.log(
      "[DEBUG] DownloadButton mounted for song:",
      song.title,
      song.id
    );
    checkDownloadStatus();
  }, [song.id]);

  // ダウンロード状態をチェック
  const checkDownloadStatus = async () => {
    try {
      console.log("[DEBUG] Checking download status for song:", song.id);
      const offlineStorageService = getOfflineStorageService();
      const downloaded = await offlineStorageService.isSongDownloaded(song.id);
      console.log(
        "[DEBUG] Song download status:",
        downloaded ? "Downloaded" : "Not downloaded"
      );
      setIsDownloaded(downloaded);
    } catch (error) {
      console.error("[ERROR] Failed to check download status:", error);
    }
  };

  // 曲をダウンロード
  const handleDownload = async () => {
    try {
      console.log("[DEBUG] Starting download for song:", song.title, song.id);
      setIsLoading(true);
      const offlineStorageService = getOfflineStorageService();
      const result = await offlineStorageService.downloadSong(song);

      console.log("[DEBUG] Download result:", result);
      if (result.success) {
        console.log("[DEBUG] Download successful, updating UI");
        setIsDownloaded(true);
      } else {
        console.error("[ERROR] Download failed:", result.error);
      }
    } catch (error) {
      console.error("[ERROR] Error downloading song:", error);
    } finally {
      console.log("[DEBUG] Download process completed");
      setIsLoading(false);
    }
  };

  // ダウンロードした曲を削除
  const handleDelete = async () => {
    try {
      console.log("[DEBUG] Starting deletion for song:", song.title, song.id);
      setIsLoading(true);
      const offlineStorageService = getOfflineStorageService();
      const result = await offlineStorageService.deleteSong(song.id);

      console.log("[DEBUG] Deletion result:", result);
      if (result.success) {
        console.log("[DEBUG] Deletion successful, updating UI");
        setIsDownloaded(false);
      } else {
        console.error("[ERROR] Delete failed:", result.error);
      }
    } catch (error) {
      console.error("[ERROR] Error deleting song:", error);
    } finally {
      console.log("[DEBUG] Deletion process completed");
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
        {Platform.OS === "test" ? (
          <Text>cloud-done</Text>
        ) : (
          <Ionicons name="cloud-done" size={size} color={color} />
        )}
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
      {Platform.OS === "test" ? (
        <Text>cloud-download-outline</Text>
      ) : (
        <Ionicons name="cloud-download-outline" size={size} color={color} />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    padding: 8,
  },
});
