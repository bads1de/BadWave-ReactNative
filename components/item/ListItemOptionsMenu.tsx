import React, { memo, useCallback } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Image } from "expo-image";
import {
  Heart,
  PlusCircle,
  Download,
  Trash2,
  CloudOff,
  MoreVertical,
} from "lucide-react-native";
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
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import AddPlaylist from "@/components/playlist/AddPlaylist";
import Toast from "react-native-toast-message";
import { FONTS } from "@/constants/theme";
import { useSongOptionsMenu } from "@/hooks/common/useSongOptionsMenu";

interface ListItemOptionsMenuProps {
  song: Song;
  onDelete?: () => void;
  currentPlaylistId?: string;
}

interface ListItemOptionsModalProps {
  song: Song;
  onDelete?: () => void;
  currentPlaylistId?: string;
  modalVisible: boolean;
  handleCloseModal: () => void;
  /** Modal 外（親）で取得した SafeAreaInsets.bottom を渡す */
  bottomInset: number;
}

interface ListItemOptionsButtonProps {
  onPress: () => void;
  testID?: string;
}

interface ListItemOptionsSheetProps {
  song: Song | null;
  onDelete?: () => void;
  currentPlaylistId?: string;
  visible: boolean;
  onClose: () => void;
}

function ListItemOptionsModal({
  song,
  onDelete,
  currentPlaylistId,
  modalVisible,
  handleCloseModal,
  bottomInset,
}: ListItemOptionsModalProps) {
  const { isOnline } = useNetworkStatus();
  const { session } = useAuth();
  const colors = useThemeStore((state) => state.colors);
  const userId = session?.user?.id;

  /**
   * sheetPaddingBottom:
   * - bottomInset: Android システムナビゲーションバー(◁○□)の高さ。
   *   Modal 内では useSafeAreaInsets が 0 を返す場合があるため、
   *   親コンポーネント(ListItemOptionsMenu)で取得して props で受け取る。
   * - 最低保証余白 20px を加算。
   */
  const sheetPaddingBottom = Math.max(bottomInset, 20) + 20;

  // ダウンロード状態
  const { data: isDownloaded = false } = useDownloadStatus(song.id);
  const { mutate: downloadSong, isPending: isDownloading } = useDownloadSong();
  const { mutate: deleteSong, isPending: isDeleting } =
    useDeleteDownloadedSong();

  // いいね状態
  const { isLiked } = useLikeStatus(song.id, userId);
  const { mutate: toggleLike, isPending: isLiking } = useLikeMutation(
    song.id,
    userId,
  );

  const handleDownload = () => {
    if (!isOnline) {
      Alert.alert(
        "オフラインです",
        "ダウンロードにはインターネット接続が必要です",
      );
      return;
    }
    downloadSong(song);
    handleCloseModal();
  };

  const handleDeleteDownload = () => {
    deleteSong(song.id);
    handleCloseModal();
  };

  const handleToggleLike = () => {
    if (!isOnline) {
      Alert.alert(
        "オフラインです",
        "いいね操作にはインターネット接続が必要です",
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
    handleCloseModal();
  };

  const renderOption = (
    label: string,
    Icon: any,
    onPress: () => void,
    color: string = colors.text,
    isDisabled: boolean = false,
    testID?: string,
  ) => (
    <TouchableOpacity
      style={[styles.option, isDisabled && styles.optionDisabled]}
      onPress={onPress}
      disabled={isDisabled}
      testID={testID}
    >
      <View
        style={[
          styles.iconWrapper,
          {
            backgroundColor:
              color === colors.error
                ? colors.error + "20"
                : "rgba(255,255,255,0.05)",
          },
        ]}
      >
        <Icon size={20} color={color} strokeWidth={1.5} />
      </View>
      <Text style={[styles.optionText, { color }]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="slide"
      onRequestClose={handleCloseModal}
    >
      <View style={styles.modalRoot}>
        <View style={styles.overlay}>
          <Pressable style={styles.flex} onPress={handleCloseModal} />
        </View>

        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              paddingBottom: sheetPaddingBottom,
            },
          ]}
        >
          <View style={styles.handle} />

          {/* Song Header */}
          <View style={styles.header}>
            <Image
              source={{ uri: song.image_path }}
              style={styles.headerImage}
              contentFit="cover"
            />
            <View style={styles.headerInfo}>
              <Text
                style={[styles.songTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {song.title}
              </Text>
              <Text
                style={[styles.songAuthor, { color: colors.subText }]}
                numberOfLines={1}
              >
                {song.author}
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.optionsList}>
            {/* いいねオプション */}
            {userId &&
              renderOption(
                isLiking ? "処理中..." : isLiked ? "いいねを解除" : "いいね",
                Heart,
                handleToggleLike,
                isLiked ? "#ff4444" : colors.text,
                isLiking || !isOnline,
                "like-option",
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
                  <View style={styles.iconWrapper}>
                    <PlusCircle
                      size={20}
                      color={isOnline ? colors.primary : colors.subText}
                      strokeWidth={1.5}
                    />
                  </View>
                  <Text
                    style={[
                      styles.optionText,
                      { color: isOnline ? colors.text : colors.subText },
                    ]}
                  >
                    プレイリストに追加
                  </Text>
                </View>
              </AddPlaylist>
            )}

            {/* ダウンロード/削除オプション */}
            {!isDownloaded
              ? renderOption(
                  isDownloading ? "ダウンロード中..." : "ダウンロード",
                  Download,
                  handleDownload,
                  isOnline ? colors.text : colors.subText,
                  isDownloading || !isOnline,
                  "download-option",
                )
              : renderOption(
                  isDeleting ? "削除中..." : "オフライン保存を削除",
                  CloudOff,
                  handleDeleteDownload,
                  colors.error,
                  isDeleting,
                  "delete-download-option",
                )}

            {/* プレイリストから削除（オーナーのみ） */}
            {onDelete &&
              renderOption(
                "プレイリストから削除",
                Trash2,
                () => {
                  onDelete();
                  handleCloseModal();
                },
                colors.error,
                false,
                "delete-option",
              )}
          </View>

          <TouchableOpacity
            style={[
              styles.closeButton,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            onPress={handleCloseModal}
          >
            <Text style={[styles.closeButtonText, { color: colors.text }]}>
              閉じる
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export const ListItemOptionsButton = memo(function ListItemOptionsButton({
  onPress,
  testID = "menu-button",
}: ListItemOptionsButtonProps) {
  const colors = useThemeStore((state) => state.colors);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.menuButton, { borderColor: colors.border }]}
      testID={testID}
    >
      <MoreVertical size={20} color={colors.text} strokeWidth={1.5} />
    </TouchableOpacity>
  );
});

export const ListItemOptionsSheet = memo(function ListItemOptionsSheet({
  song,
  onDelete,
  currentPlaylistId,
  visible,
  onClose,
}: ListItemOptionsSheetProps) {
  const { bottom: bottomInset } = useSafeAreaInsets();

  if (!song) {
    return null;
  }

  return (
    <ListItemOptionsModal
      song={song}
      onDelete={onDelete}
      currentPlaylistId={currentPlaylistId}
      modalVisible={visible}
      handleCloseModal={onClose}
      bottomInset={bottomInset}
    />
  );
});

function ListItemOptionsMenu({
  song,
  onDelete,
  currentPlaylistId,
}: ListItemOptionsMenuProps) {
  const {
    selectedSong,
    isSongOptionsVisible,
    openSongOptions,
    closeSongOptions,
  } = useSongOptionsMenu();

  const handleOpenModal = useCallback(() => {
    openSongOptions(song);
  }, [openSongOptions, song]);

  return (
    <>
      <ListItemOptionsButton onPress={handleOpenModal} />
      <ListItemOptionsSheet
        song={selectedSong}
        onDelete={onDelete}
        currentPlaylistId={currentPlaylistId}
        visible={isSongOptionsVisible}
        onClose={closeSongOptions}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  menuButton: {
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    paddingBottom: 40,
    paddingHorizontal: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  headerImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  songTitle: {
    fontSize: 18,
    fontFamily: FONTS.bold,
  },
  songAuthor: {
    fontSize: 14,
    fontFamily: FONTS.body,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 10,
  },
  optionsList: {
    gap: 4,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 16,
  },
  optionDisabled: {
    opacity: 0.5,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  optionText: {
    fontSize: 16,
    fontFamily: FONTS.semibold,
    marginLeft: 16,
  },
  closeButton: {
    marginTop: 20,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  closeButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});

export default memo(ListItemOptionsMenu, (prevProps, nextProps) => {
  return (
    prevProps.song.id === nextProps.song.id &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.currentPlaylistId === nextProps.currentPlaylistId
  );
});
