import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import type { BulkDownloadProgress } from "@/hooks/downloads/useBulkDownload";

interface BulkDownloadModalProps {
  visible: boolean;
  progress: BulkDownloadProgress;
  isDownloading: boolean;
  mode: "download" | "delete";
  onCancel: () => void;
  onClose: () => void;
  error?: string | null;
}

/**
 * 一括ダウンロード/削除の進捗を表示するモーダル
 */
export function BulkDownloadModal({
  visible,
  progress,
  isDownloading,
  mode,
  onCancel,
  onClose,
  error,
}: BulkDownloadModalProps) {
  const isComplete = !isDownloading && progress.current === progress.total;
  const hasError = !!error;

  const getTitle = () => {
    if (hasError) return "エラー";
    if (isComplete)
      return mode === "download" ? "ダウンロード完了" : "削除完了";
    return mode === "download" ? "ダウンロード中..." : "削除中...";
  };

  const getIcon = () => {
    if (hasError) return "alert-circle";
    if (isComplete) return "checkmark-circle";
    return mode === "download" ? "cloud-download" : "trash";
  };

  const getIconColor = () => {
    if (hasError) return "#ef4444";
    if (isComplete) return "#22c55e";
    return "#a78bfa";
  };

  const progressPercent =
    progress.total > 0 ? (progress.current / progress.total) * 100 : 0;

  return (
    <Modal visible={visible} transparent animationType="fade">
      <BlurView intensity={40} tint="dark" style={styles.overlay}>
        <View style={styles.container}>
          {/* アイコン */}
          <View style={styles.iconContainer}>
            {isDownloading ? (
              <ActivityIndicator size="large" color="#a78bfa" />
            ) : (
              <Ionicons name={getIcon()} size={48} color={getIconColor()} />
            )}
          </View>

          {/* タイトル */}
          <Text style={styles.title}>{getTitle()}</Text>

          {/* 進捗バー */}
          {isDownloading && (
            <>
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <View
                    style={[
                      styles.progressBar,
                      { width: `${progressPercent}%` },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.progressText}>
                {progress.current} / {progress.total} 曲
              </Text>
            </>
          )}

          {/* エラーメッセージ */}
          {hasError && <Text style={styles.errorText}>{error}</Text>}

          {/* 完了メッセージ */}
          {isComplete && !hasError && (
            <Text style={styles.completeText}>
              {mode === "download"
                ? `${progress.total}曲をダウンロードしました`
                : `${progress.total}曲を削除しました`}
            </Text>
          )}

          {/* ボタン */}
          <View style={styles.buttonContainer}>
            {isDownloading ? (
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onCancel}
              >
                <Text style={styles.buttonText}>キャンセル</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.button, styles.closeButton]}
                onPress={onClose}
              >
                <Text style={styles.buttonText}>閉じる</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    backgroundColor: "rgba(30, 30, 36, 0.95)",
    borderRadius: 24,
    padding: 32,
    width: "85%",
    maxWidth: 340,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(167, 139, 250, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 16,
    textAlign: "center",
  },
  progressContainer: {
    width: "100%",
    marginBottom: 12,
  },
  progressBackground: {
    height: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    backgroundColor: "#a78bfa",
    borderRadius: 4,
  },
  progressText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    marginBottom: 20,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  completeText: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    width: "100%",
  },
  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(239, 68, 68, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.3)",
  },
  closeButton: {
    backgroundColor: "rgba(167, 139, 250, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(167, 139, 250, 0.3)",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

