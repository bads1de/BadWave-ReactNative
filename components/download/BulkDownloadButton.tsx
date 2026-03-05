import React, { useState, useCallback } from "react";
import { TouchableOpacity, Text, StyleSheet, Alert, View } from "react-native";
import { CloudDownload, Trash2 } from "lucide-react-native";
import { BlurView } from "expo-blur";
import { useBulkDownload } from "@/hooks/downloads/useBulkDownload";
import { BulkDownloadModal } from "@/components/download/BulkDownloadModal";
import Song from "@/types";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";

interface BulkDownloadButtonProps {
  songs: Song[];
  /** ボタンのスタイルバリアント */
  variant?: "primary" | "secondary";
  /** ボタンのサイズ */
  size?: "small" | "medium" | "large";
}

/**
 * 一括ダウンロード/削除ボタン (Premium HUD Design)
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
  const colors = useThemeStore((state) => state.colors);

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

  const getButtonConfig = () => {
    const remainingCount = totalCount - downloadedCount;

    switch (status) {
      case "none":
        return {
          label: `Download All (${totalCount})`,
          Icon: CloudDownload,
          action: handleDownload,
          isDelete: false,
        };
      case "partial":
        return {
          label: `Download Rest (${remainingCount})`,
          Icon: CloudDownload,
          action: handleDownload,
          isDelete: false,
        };
      case "all":
        return {
          label: "Delete All Downloads",
          Icon: Trash2,
          action: handleDelete,
          isDelete: true,
        };
    }
  };

  const handleDownload = useCallback(() => {
    if (!isOnline) {
      Alert.alert(
        "オフライン",
        "ダウンロードにはインターネット接続が必要です。",
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
      ],
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

  // サイズ計算
  const isSmall = size === "small";
  const isLarge = size === "large";
  const buttonHeight = isSmall ? 36 : isLarge ? 56 : 44;
  const fontSize = isSmall ? 12 : isLarge ? 15 : 14;
  const iconSize = isSmall ? 16 : isLarge ? 20 : 18;
  const borderRadius = isSmall ? 12 : 16;
  const paddingH = isSmall ? 14 : isLarge ? 24 : 18;

  // カラー計算
  const isDel = config.isDelete;
  const baseColor = isDel
    ? "#EF4444"
    : variant === "primary"
      ? colors.primary
      : colors.text;
  const borderColor = isDel
    ? "rgba(239, 68, 68, 0.4)"
    : variant === "primary"
      ? colors.primary + "50"
      : "rgba(255, 255, 255, 0.15)";
  const bgColor = isDel
    ? "rgba(239, 68, 68, 0.15)"
    : variant === "primary"
      ? "rgba(10, 10, 10, 0.4)"
      : "rgba(255, 255, 255, 0.05)";

  const textColor = isDel ? "#EF4444" : colors.text;

  return (
    <>
      <TouchableOpacity
        style={[
          styles.touchable,
          { height: buttonHeight, borderRadius },
          isDownloading && { opacity: 0.5 },
        ]}
        onPress={config.action}
        activeOpacity={0.7}
        disabled={isDownloading}
      >
        <BlurView
          intensity={variant === "primary" && !isDel ? 20 : 10}
          tint="dark"
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius,
              backgroundColor: bgColor,
              borderColor,
              borderWidth: 1,
            },
          ]}
        />
        <View style={[styles.contentWrapper, { paddingHorizontal: paddingH }]}>
          <config.Icon
            size={iconSize}
            color={baseColor}
            strokeWidth={isSmall ? 2 : 1.8}
          />
          <Text style={[styles.label, { fontSize, color: textColor }]}>
            {config.label}
          </Text>
        </View>
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
  touchable: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },

  contentWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: "100%",
  },
  label: {
    fontFamily: FONTS.semibold,
    letterSpacing: 0.3,
  },
});
