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
import { CACHED_QUERIES } from "@/constants";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";

interface PlaylistOptionsMenuProps {
  playlistId: string;
  userId?: string;
  currentTitle?: string;
}

export default function PlaylistOptionsMenu({
  playlistId,
  userId,
  currentTitle,
}: PlaylistOptionsMenuProps) {
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newTitle, setNewTitle] = useState(currentTitle || "");
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const router = useRouter();

  const isOwner = session?.user.id === userId;

  const { mutate: deleteMutation } = useMutation({
    mutationFn: () => deletePlaylist(playlistId, session?.user.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.playlists] });
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
    backgroundColor: "#1a1a1a",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  menuText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 12,
  },
  deleteText: {
    color: "red",
    fontSize: 16,
    marginLeft: 12,
  },
  modalTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
  },
  input: {
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    padding: 12,
    color: "#fff",
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  button: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  cancelButton: {
    backgroundColor: "#2a2a2a",
  },
  saveButton: {
    backgroundColor: "#8b5cf6",
  },
  buttonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "500",
  },
});
