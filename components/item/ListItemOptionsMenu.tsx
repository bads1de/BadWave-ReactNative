import React, { useState, memo } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Song from "@/types";
import {
  useDownloadStatus,
  useDownloadSong,
  useDeleteDownloadedSong,
} from "@/hooks/downloads/useDownloadStatus";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useLikeStatus } from "@/hooks/data/useLikeStatus";
import { useLikeMutation } from "@/hooks/mutations/useLikeMutation";
import { useAuth } from "@/providers/AuthProvider";
import AddPlaylist from "@/components/playlist/AddPlaylist";
import Toast from "react-native-toast-message";

interface ListItemOptionsMenuProps {
  song: Song;
  onDelete?: () => void;
  /** プレイリスト画面から呼び出された場合のプレイリストID（追加済み判定に使用） */
  currentPlaylistId?: string;
}

function ListItemOptionsMenu({
  song,
  onDelete,
  currentPlaylistId,
}: ListItemOptionsMenuProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const { isOnline } = useNetworkStatus();
  const { session } = useAuth();
  const userId = session?.user?.id;

  // ダウンロード状態
  const { data: isDownloaded = false } = useDownloadStatus(song.id);
  const { mutate: downloadSong, isPending: isDownloading } = useDownloadSong();
  const { mutate: deleteSong, isPending: isDeleting } =
    useDeleteDownloadedSong();

  // いいね状態
  const { isLiked } = useLikeStatus(song.id, userId);
  const { mutate: toggleLike, isPending: isLiking } = useLikeMutation(
    song.id,
    userId
  );

  const handleDownload = () => {
    if (!isOnline) {
      Alert.alert(
        "オフラインです",
        "ダウンロードにはインターネット接続が必要です"
      );
      return;
    }
    downloadSong(song);
    setModalVisible(false);
  };

  const handleDeleteDownload = () => {
    deleteSong(song.id);
    setModalVisible(false);
  };

  const handleToggleLike = () => {
    if (!isOnline) {
      Alert.alert(
        "オフラインです",
        "いいね操作にはインターネット接続が必要です"
      );
      return;
    }
    if (!userId) {
      Alert.alert("ログインが必要です", "いいねするにはログインしてください");
      return;
    }
    toggleLike(isLiked, {
      onSuccess: () => {
        Toast.show({
          type: "success",
          text1: isLiked ? "いいねを解除しました" : "いいねしました",
        });
      },
      onError: (error) => {
        Toast.show({
          type: "error",
          text1: "エラーが発生しました",
          text2: error.message,
        });
      },
    });
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setModalVisible(true)}
        style={styles.menuButton}
        testID="menu-button"
      >
        <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <BlurView intensity={30} tint="dark" style={styles.modalContainer}>
            <View style={styles.modalContent}>
              {/* いいねオプション */}
              {userId && (
                <TouchableOpacity
                  style={[styles.option, !isOnline && styles.optionDisabled]}
                  onPress={handleToggleLike}
                  disabled={isLiking}
                  testID="like-option"
                >
                  <Ionicons
                    name={isLiked ? "heart" : "heart-outline"}
                    size={24}
                    color={isLiked ? "#ff4444" : isOnline ? "#fff" : "#666"}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      isLiked && styles.likedText,
                      !isOnline && styles.optionTextDisabled,
                    ]}
                  >
                    {isLiking
                      ? "処理中..."
                      : isLiked
                      ? "いいねを解除"
                      : "いいね"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* プレイリストに追加 */}
              {userId && (
                <AddPlaylist
                  songId={song.id}
                  currentPlaylistId={currentPlaylistId}
                >
                  <View
                    style={[styles.option, !isOnline && styles.optionDisabled]}
                    testID="add-to-playlist-option"
                  >
                    <Ionicons
                      name="add-circle-outline"
                      size={24}
                      color={isOnline ? "#00dbde" : "#666"}
                    />
                    <Text
                      style={[
                        styles.optionText,
                        styles.addPlaylistText,
                        !isOnline && styles.optionTextDisabled,
                      ]}
                    >
                      プレイリストに追加
                    </Text>
                  </View>
                </AddPlaylist>
              )}

              {/* ダウンロード/削除オプション */}
              {!isDownloaded ? (
                <TouchableOpacity
                  style={[styles.option, !isOnline && styles.optionDisabled]}
                  onPress={handleDownload}
                  disabled={isDownloading}
                  testID="download-option"
                >
                  <Ionicons
                    name="cloud-download-outline"
                    size={24}
                    color={isOnline ? "#fff" : "#666"}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      !isOnline && styles.optionTextDisabled,
                    ]}
                  >
                    {isDownloading ? "ダウンロード中..." : "ダウンロード"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.option}
                  onPress={handleDeleteDownload}
                  disabled={isDeleting}
                  testID="delete-download-option"
                >
                  <Ionicons
                    name="cloud-offline-outline"
                    size={24}
                    color="#FF6B6B"
                  />
                  <Text style={[styles.optionText, styles.deleteDownloadText]}>
                    {isDeleting ? "削除中..." : "ダウンロード済みを削除"}
                  </Text>
                </TouchableOpacity>
              )}

              {/* プレイリストから削除（オーナーのみ） */}
              {onDelete && (
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => {
                    onDelete();
                    setModalVisible(false);
                  }}
                  testID="delete-option"
                >
                  <Ionicons name="trash-outline" size={24} color="#ff4444" />
                  <Text style={[styles.optionText, styles.deleteText]}>
                    プレイリストから削除
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </BlurView>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// メモ化してエクスポート
export default memo(ListItemOptionsMenu, (prevProps, nextProps) => {
  return (
    prevProps.song.id === nextProps.song.id &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.currentPlaylistId === nextProps.currentPlaylistId
  );
});

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "80%",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  modalContent: {
    backgroundColor: "rgba(30, 30, 30, 0.8)",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.1)",
  },
  optionDisabled: {
    opacity: 0.5,
  },
  optionText: {
    color: "#fff",
    fontSize: 16,
    marginLeft: 12,
  },
  optionTextDisabled: {
    color: "#666",
  },
  likedText: {
    color: "#ff4444",
  },
  addPlaylistText: {
    color: "#00dbde",
  },
  deleteDownloadText: {
    color: "#FF6B6B",
  },
  deleteText: {
    color: "#ff4444",
  },
});
