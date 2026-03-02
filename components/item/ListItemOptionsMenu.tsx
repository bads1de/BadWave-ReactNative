import React, { useState, memo, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  Dimensions,
  Pressable,
} from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import {
  Heart,
  PlusCircle,
  Download,
  Trash2,
  CloudOff,
  MoreVertical,
  Music,
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

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface ListItemOptionsMenuProps {
  song: Song;
  onDelete?: () => void;
  /** プレイリスト画面から呼び出された場合のプレイリストID（追加済み判定に使用） */
  currentPlaylistId?: string;
}

function ListItemOptionsModal({
  song,
  onDelete,
  currentPlaylistId,
  modalVisible,
  handleCloseModal,
  opacity,
  translateY,
}: any) {
  const { isOnline } = useNetworkStatus();
  const { session } = useAuth();
  const colors = useThemeStore((state) => state.colors);
  const userId = session?.user?.id;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    deleteSong(song.id);
    handleCloseModal();
  };

  const handleToggleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
      animationType="none"
      onRequestClose={handleCloseModal}
    >
      <View style={styles.modalRoot}>
        <Animated.View style={[styles.overlay, overlayStyle]}>
          <Pressable style={styles.flex} onPress={handleCloseModal} />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { backgroundColor: colors.background, borderColor: colors.border },
            animatedStyle,
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
        </Animated.View>
      </View>
    </Modal>
  );
}

function ListItemOptionsMenu({
  song,
  onDelete,
  currentPlaylistId,
}: ListItemOptionsMenuProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const colors = useThemeStore((state) => state.colors);

  // Animation shared values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (modalVisible) {
      setShouldRender(true);
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 80,
      });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(
        SCREEN_HEIGHT,
        { duration: 300 },
        (isFinished) => {
          if (isFinished) {
            // React Native Reanimatedのワークレット内から状態を更新するには少し工夫が必要な場合があるため
            // タイムアウトなどを利用して安全にアンマウントする
          }
        },
      );
      const timeout = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [modalVisible, opacity, translateY]);

  const handleOpenModal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={handleOpenModal}
        style={[styles.menuButton, { borderColor: colors.border }]}
        testID="menu-button"
      >
        <MoreVertical size={20} color={colors.text} strokeWidth={1.5} />
      </TouchableOpacity>

      {shouldRender && (
        <ListItemOptionsModal
          song={song}
          onDelete={onDelete}
          currentPlaylistId={currentPlaylistId}
          modalVisible={modalVisible}
          handleCloseModal={handleCloseModal}
          translateY={translateY}
          opacity={opacity}
        />
      )}
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
