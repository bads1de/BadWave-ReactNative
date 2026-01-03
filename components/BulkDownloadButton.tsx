import React, { useState, useCallback } from "react";
import { TouchableOpacity, Text, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useBulkDownload } from "@/hooks/downloads/useBulkDownload";
import { BulkDownloadModal } from "./BulkDownloadModal";
import Song from "@/types";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useThemeStore } from "@/hooks/stores/useThemeStore";

interface BulkDownloadButtonProps {
  songs: Song[];
  /** ボタンのスタイルバリアント */
  variant?: "primary" | "secondary";
  /** ボタンのサイズ */
  size?: "small" | "medium" | "large";
}

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

/**
 * 一括ダウンロード/削除ボタン
 * - 未ダウンロード: 「すべてダウンロード」
 * - 一部ダウンロード: 「残りをダウンロード (N曲)」
 * - 全ダウンロード: 「すべて削除」
 */
export function BulkDownloadButton({
  songs,
  variant = "primary",
  size = "medium",
}: BulkDownloadButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState<"download" | "delete">("download");
  const { colors } = useThemeStore();

  const { isOnline } = useNetworkStatus();

  const {
    status,
    downloadedCount,
    totalCount,
    isDownloading,
    progress,
    error,
    startDownload,
    startDelete,
    cancel,
  } = useBulkDownload(songs);

  const getButtonConfig = (): {
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    action: () => void;
  } => {
    const remainingCount = totalCount - downloadedCount;

    switch (status) {
      case "none":
        return {
          label: `すべてダウンロード (${totalCount}曲)`,
          icon: "cloud-download-outline",
          action: handleDownload,
        };
      case "partial":
        return {
          label: `残りをダウンロード (${remainingCount}曲)`,
          icon: "cloud-download-outline",
          action: handleDownload,
        };
      case "all":
        return {
          label: "すべて削除",
          icon: "trash-outline",
          action: handleDelete,
        };
    }
  };

  const handleDownload = useCallback(() => {
    if (!isOnline) {
      Alert.alert(
        "オフライン",
        "ダウンロードにはインターネット接続が必要です。"
      );
      return;
    }
    setModalMode("download");
    setModalVisible(true);
    startDownload();
  }, [isOnline, startDownload]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      "確認",
      `${downloadedCount}曲のダウンロードデータを削除しますか？`,
      [
        { text: "キャンセル", style: "cancel" },
        {
          text: "削除",
          style: "destructive",
          onPress: () => {
            setModalMode("delete");
            setModalVisible(true);
            startDelete();
          },
        },
      ]
    );
  }, [downloadedCount, startDelete]);

  const handleCancel = useCallback(() => {
    cancel();
    setModalVisible(false);
  }, [cancel]);

  const handleClose = useCallback(() => {
    setModalVisible(false);
  }, []);

  const config = getButtonConfig();

  // 曲がない場合は表示しない
  if (songs.length === 0) {
    return null;
  }

  const primaryStyle = {
    backgroundColor: hexToRgba(colors.primary, 0.2),
    borderWidth: 1,
    borderColor: hexToRgba(colors.primary, 0.3),
  };

  const buttonStyles = [
    styles.button,
    variant === "primary" ? primaryStyle : styles.secondaryButton, // styles.primaryButtonの代わりに動的スタイルを使用
    size === "small" && styles.smallButton,
    size === "large" && styles.largeButton,
    status === "all" && styles.deleteButton,
  ];

  const textStyles = [
    styles.buttonText,
    size === "small" && styles.smallText,
    size === "large" && styles.largeText,
    status === "all" && styles.deleteText,
    { color: status === "all" ? "#ef4444" : colors.text }, // テキスト色もテーマ適用
  ];

  const iconSize = size === "small" ? 16 : size === "large" ? 24 : 20;

  return (
    <>
      <TouchableOpacity
        style={buttonStyles}
        onPress={config.action}
        activeOpacity={0.7}
        disabled={isDownloading}
      >
        <Ionicons
          name={config.icon}
          size={iconSize}
          color={status === "all" ? "#ef4444" : colors.text}
          style={styles.icon}
        />
        <Text style={textStyles}>{config.label}</Text>
      </TouchableOpacity>

      <BulkDownloadModal
        visible={modalVisible}
        progress={progress}
        isDownloading={isDownloading}
        mode={modalMode}
        onCancel={handleCancel}
        onClose={handleClose}
        error={error}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: "rgba(167, 139, 250, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  secondaryButton: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  deleteButton: {
    backgroundColor: "rgba(239, 68, 68, 0.15)",
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  smallButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  largeButton: {
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 16,
  },
  icon: {
    marginRight: 4,
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  smallText: {
    fontSize: 12,
  },
  largeText: {
    fontSize: 16,
  },
  deleteText: {
    color: "#ef4444",
  },
});
