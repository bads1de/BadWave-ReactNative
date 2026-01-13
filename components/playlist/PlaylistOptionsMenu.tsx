import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/providers/AuthProvider";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import deletePlaylist from "@/actions/deletePlaylist";
import renamePlaylist from "@/actions/renamePlaylist";
import togglePublicPlaylist from "@/actions/togglePublicPlaylist";
import { CACHED_QUERIES } from "@/constants";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import CustomAlertDialog from "../common/CustomAlertDialog";
import { useBulkDownload } from "@/hooks/downloads/useBulkDownload";
import { BulkDownloadModal } from "@/components/BulkDownloadModal";
import Song from "@/types";

interface PlaylistOptionsMenuProps {
  playlistId: string;
  userId?: string;
  currentTitle?: string;
  isPublic?: boolean;
  songs?: Song[];
}

export default function PlaylistOptionsMenu({
  playlistId,
  userId,
  currentTitle,
  isPublic = false,
  songs = [],
}: PlaylistOptionsMenuProps) {
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTitle, setNewTitle] = useState(currentTitle || "");
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { isOnline } = useNetworkStatus();

  const isOwner = session?.user.id === userId;

  // 一括ダウンロード
  const {
    status: bulkStatus,
    progress: bulkProgress,
    startDownload,
    startDelete,
    cancel: cancelBulk,
    error: bulkError,
    downloadedCount,
    isDownloading,
  } = useBulkDownload(songs);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMode, setBulkMode] = useState<"download" | "delete">("download");
  const allDownloaded = bulkStatus === "all";

  // オフライン時のアラート表示ヘルパー
  const showOfflineAlert = () => {
    Alert.alert("オフラインです", "この操作にはインターネット接続が必要です", [
      { text: "OK" },
    ]);
  };

  const { mutate: togglePublicMutation } = useMutation({
    mutationFn: (newPublicState: boolean) =>
      togglePublicPlaylist(playlistId, session?.user.id!, newPublicState),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.playlists] });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistById, playlistId],
      });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.getPublicPlaylists],
      });
      Toast.show({
        type: "success",
        text1: isPublic
          ? "プレイリストを非公開にしました"
          : "プレイリストを公開しました",
      });
      setShowOptionsModal(false);
    },
    onError: (err: Error) => {
      Toast.show({
        type: "error",
        text1: "通信エラーが発生しました",
        text2: err.message,
      });
    },
  });

  const { mutate: deleteMutation } = useMutation({
    mutationFn: () => deletePlaylist(playlistId, session?.user.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.playlists] });

      if (isPublic) {
        queryClient.invalidateQueries({
          queryKey: [CACHED_QUERIES.getPublicPlaylists],
        });
      }

      Toast.show({
        type: "success",
        text1: "プレイリストを削除しました",
      });

      router.push({ pathname: "/library" });
    },
    onError: (err: Error) => {
      Toast.show({
        type: "error",
        text1: "通信エラーが発生しました",
        text2: err.message,
      });
    },
  });

  const { mutate: renameMutation } = useMutation({
    mutationFn: () => renamePlaylist(playlistId, newTitle, session?.user.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.playlists] });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistById, playlistId],
      });
      Toast.show({
        type: "success",
        text1: "プレイリスト名を変更しました",
      });
      setShowRenameModal(false);
      setShowOptionsModal(false);
    },
    onError: (err: Error) => {
      Toast.show({
        type: "error",
        text1: "通信エラーが発生しました",
        text2: err.message,
      });
    },
  });

  const handleDeleteConfirm = () => {
    if (!isOnline) {
      showOfflineAlert();
      return;
    }
    setShowDeleteDialog(false);
    deleteMutation();
  };

  const handleRename = () => {
    if (!isOnline) {
      showOfflineAlert();
      setShowRenameModal(false);
      return;
    }
    if (newTitle.trim()) {
      renameMutation();
    }
  };

  const handleTogglePublic = () => {
    if (!isOnline) {
      showOfflineAlert();
      return;
    }
    togglePublicMutation(!isPublic);
  };

  const handleBulkDownload = () => {
    if (!isOnline) {
      showOfflineAlert();
      return;
    }
    setShowOptionsModal(false);
    setBulkMode("download");
    setShowBulkModal(true);
    startDownload();
  };

  const handleBulkDelete = () => {
    setShowOptionsModal(false);
    setBulkMode("delete");
    setShowBulkModal(true);
    startDelete();
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setShowOptionsModal(true)}
        style={styles.menuButton}
        testID="menu-button"
      >
        <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
        testID="options-modal"
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
          testID="options-modal-overlay"
        >
          <View style={styles.modalContent}>
            {isOwner && (
              <>
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    !isOnline && styles.menuItemDisabled,
                  ]}
                  onPress={() => {
                    if (!isOnline) {
                      showOfflineAlert();
                      return;
                    }
                    setShowRenameModal(true);
                    setShowOptionsModal(false);
                  }}
                >
                  <Ionicons
                    name="pencil-outline"
                    size={24}
                    color={isOnline ? "#fff" : "#666"}
                  />
                  <Text
                    style={[
                      styles.menuText,
                      !isOnline && styles.menuTextDisabled,
                    ]}
                  >
                    プレイリスト名を変更
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    !isOnline && styles.menuItemDisabled,
                  ]}
                  onPress={handleTogglePublic}
                >
                  <Ionicons
                    name={isPublic ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color={isOnline ? "#fff" : "#666"}
                  />
                  <Text
                    style={[
                      styles.menuText,
                      !isOnline && styles.menuTextDisabled,
                    ]}
                  >
                    {isPublic ? "非公開にする" : "公開する"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.menuItem,
                    !isOnline && styles.menuItemDisabled,
                  ]}
                  onPress={() => {
                    if (!isOnline) {
                      showOfflineAlert();
                      return;
                    }
                    setShowDeleteDialog(true);
                    setShowOptionsModal(false);
                  }}
                >
                  <Ionicons
                    name="trash-outline"
                    size={24}
                    color={isOnline ? "red" : "#666"}
                  />
                  <Text
                    style={[
                      styles.deleteText,
                      !isOnline && styles.menuTextDisabled,
                    ]}
                  >
                    プレイリストを削除
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* 一括ダウンロード（誰でも使用可能） */}
            {songs.length > 0 && (
              <>
                {!allDownloaded ? (
                  <TouchableOpacity
                    style={[
                      styles.menuItem,
                      !isOnline && styles.menuItemDisabled,
                    ]}
                    onPress={handleBulkDownload}
                  >
                    <Ionicons
                      name="cloud-download-outline"
                      size={24}
                      color={isOnline ? "#fff" : "#666"}
                    />
                    <Text
                      style={[
                        styles.menuText,
                        !isOnline && styles.menuTextDisabled,
                      ]}
                    >
                      すべてダウンロード ({songs.length - downloadedCount}曲)
                    </Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.menuItem}
                    onPress={handleBulkDelete}
                  >
                    <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
                    <Text style={[styles.menuText, { color: "#FF6B6B" }]}>
                      ダウンロード済みを削除 ({downloadedCount}曲)
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 一括ダウンロードモーダル */}
      <BulkDownloadModal
        visible={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        mode={bulkMode}
        progress={bulkProgress}
        error={bulkError}
        onCancel={cancelBulk}
        isDownloading={isDownloading}
      />

      <Modal
        visible={showRenameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRenameModal(false)}
        testID="rename-modal"
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRenameModal(false)}
          testID="rename-modal-overlay"
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>プレイリスト名を変更</Text>
            <TextInput
              style={styles.input}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="新しいプレイリスト名"
              placeholderTextColor="rgba(255,255,255,0.5)"
            />
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={styles.buttonText}>キャンセル</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.saveButton]}
                onPress={handleRename}
              >
                <Text style={styles.buttonText}>保存</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      <CustomAlertDialog
        visible={showDeleteDialog}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setShowDeleteDialog(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: "#303030",
    backgroundColor: "#121212",
    borderTopWidth: 1,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  menuText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 12,
    fontWeight: "500",
  },
  menuTextDisabled: {
    color: "#666",
  },
  menuItemDisabled: {
    opacity: 0.6,
  },
  deleteText: {
    color: "#DC2626",
    fontSize: 16,
    marginLeft: 12,
    fontWeight: "500",
  },
  modalTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    height: 50,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    paddingHorizontal: 16,
    color: "#fff",
    fontSize: 16,
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  button: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  saveButton: {
    backgroundColor: "#4C1D95",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

