import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/providers/AuthProvider";
import CustomAlertDialog from "./CustomAlertDialog";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import deletePlaylist from "@/actions/deletePlaylist";
import renamePlaylist from "@/actions/renamePlaylist";
import togglePublicPlaylist from "@/actions/togglePublicPlaylist";
import { CACHED_QUERIES } from "@/constants";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

interface PlaylistOptionsMenuProps {
  playlistId: string;
  userId?: string;
  currentTitle?: string;
  isPublic?: boolean;
}

export default function PlaylistOptionsMenu({
  playlistId,
  userId,
  currentTitle,
  isPublic = false,
}: PlaylistOptionsMenuProps) {
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTitle, setNewTitle] = useState(currentTitle || "");
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const isOwner = session?.user.id === userId;

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
    setShowDeleteDialog(false);
    deleteMutation();
  };

  const handleRename = () => {
    if (newTitle.trim()) {
      renameMutation();
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          console.log("オプションメニューを開きます");
          setShowOptionsModal(true);
        }}
        style={styles.menuButton}
      >
        <Ionicons name="ellipsis-horizontal" size={24} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={showOptionsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.modalContent}>
            {isOwner && (
              <>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowRenameModal(true);
                    setShowOptionsModal(false);
                  }}
                >
                  <Ionicons name="pencil-outline" size={24} color="#fff" />
                  <Text style={styles.menuText}>プレイリスト名を変更</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => togglePublicMutation(!isPublic)}
                >
                  <Ionicons
                    name={isPublic ? "eye-off-outline" : "eye-outline"}
                    size={24}
                    color="#fff"
                  />
                  <Text style={styles.menuText}>
                    {isPublic ? "非公開にする" : "公開する"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowDeleteDialog(true);
                    setShowOptionsModal(false);
                  }}
                >
                  <Ionicons name="trash-outline" size={24} color="red" />
                  <Text style={styles.deleteText}>プレイリストを削除</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showRenameModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRenameModal(false)}
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
