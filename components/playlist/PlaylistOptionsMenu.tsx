import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  TextInput,
  Alert,
  Pressable,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import {
  Settings2,
  Edit3,
  Globe,
  Lock,
  Trash2,
  Download,
  Check,
  X,
} from "lucide-react-native";

import { useAuth } from "@/providers/AuthProvider";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import deletePlaylist from "@/actions/playlist/deletePlaylist";
import renamePlaylist from "@/actions/playlist/renamePlaylist";
import togglePublicPlaylist from "@/actions/playlist/togglePublicPlaylist";
import { CACHED_QUERIES } from "@/constants";
import { FONTS } from "@/constants/theme";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import CustomAlertDialog from "@/components/common/CustomAlertDialog";
import { useBulkDownload } from "@/hooks/downloads/useBulkDownload";
import { BulkDownloadModal } from "@/components/download/BulkDownloadModal";
import Song from "@/types";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

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
  const colors = useThemeStore((state) => state.colors);

  const isOwner = session?.user.id === userId;

  // Animation shared values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (showOptionsModal) {
      opacity.value = withTiming(1, { duration: 400 });
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 80,
      });
    } else {
      opacity.value = withTiming(0, { duration: 250 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 400 });
    }
  }, [showOptionsModal]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
  }));

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

  const handleOpenMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowOptionsModal(true);
  };

  const handleCloseMenu = () => {
    setShowOptionsModal(false);
  };

  const showOfflineAlert = () => {
    Alert.alert(
      "Offline",
      "Please connect to the internet to perform this action",
      [{ text: "OK" }],
    );
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
        text1: isPublic ? "Playlist is now private" : "Playlist is now public",
      });
      handleCloseMenu();
    },
    onError: (err: Error) => {
      Toast.show({ type: "error", text1: "Error", text2: err.message });
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
      Toast.show({ type: "success", text1: "Playlist deleted" });
      router.push({ pathname: "/library" });
    },
    onError: (err: Error) => {
      Toast.show({ type: "error", text1: "Error", text2: err.message });
    },
  });

  const { mutate: renameMutation } = useMutation({
    mutationFn: () => renamePlaylist(playlistId, newTitle, session?.user.id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.playlists] });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistById, playlistId],
      });
      Toast.show({ type: "success", text1: "Playlist renamed" });
      setShowRenameModal(false);
      handleCloseMenu();
    },
    onError: (err: Error) => {
      Toast.show({ type: "error", text1: "Error", text2: err.message });
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isOnline) {
      showOfflineAlert();
      return;
    }
    togglePublicMutation(!isPublic);
  };

  const handleBulkDownload = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!isOnline) {
      showOfflineAlert();
      return;
    }
    handleCloseMenu();
    setBulkMode("download");
    setShowBulkModal(true);
    startDownload();
  };

  const handleBulkDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleCloseMenu();
    setBulkMode("delete");
    setShowBulkModal(true);
    startDelete();
  };

  const renderOptionItem = (
    label: string,
    Icon: any,
    onPress: () => void,
    color: string = colors.text,
    subLabel?: string,
    isDisabled: boolean = false,
  ) => {
    const isDestructive = color === colors.error;
    const isSuccess = color === colors.success;

    // アイコンの色: 破壊的アクションは赤、成功/完了は緑、それ以外はテーマのプライマリ（アクセント）
    const iconColor = isDestructive
      ? colors.error
      : isSuccess
        ? colors.success
        : colors.primary;
    // テキストの色: 破壊的アクションのみ赤を維持し、それ以外は基本白（colors.text）
    const textColor = isDestructive ? colors.error : colors.text;

    return (
      <TouchableOpacity
        style={[styles.optionItem, isDisabled && styles.optionItemDisabled]}
        onPress={onPress}
        disabled={isDisabled}
      >
        <View style={styles.optionLeft}>
          <View
            style={[
              styles.iconBox,
              {
                borderColor: isDestructive
                  ? colors.error + "30"
                  : colors.border,
              },
            ]}
          >
            <Icon size={20} color={iconColor} strokeWidth={1.5} />
          </View>
          <View style={styles.optionTextContainer}>
            <Text style={[styles.optionLabel, { color: textColor }]}>
              {label}
            </Text>
            {subLabel && (
              <Text style={styles.optionSubLabel} numberOfLines={1}>
                {subLabel}
              </Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <TouchableOpacity
        onPress={handleOpenMenu}
        style={[styles.menuButton, { borderColor: colors.border }]}
        testID="menu-button"
      >
        <Settings2 size={20} color={colors.text} strokeWidth={1.5} />
      </TouchableOpacity>

      <Modal
        visible={showOptionsModal}
        transparent
        animationType="none"
        onRequestClose={handleCloseMenu}
      >
        <View style={styles.modalRoot} testID="options-modal">
          <Animated.View
            style={[styles.overlay, overlayStyle]}
            testID="options-modal-overlay"
          >
            <Pressable style={styles.flex} onPress={handleCloseMenu} />
          </Animated.View>

          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
              animatedStyle,
            ]}
          >
            <View style={styles.sheetHeader}>
              <View style={styles.handle} />
              <View style={styles.headerInfoRow}>
                {songs.length > 0 && songs[0].image_path ? (
                  <Image
                    source={{ uri: songs[0].image_path }}
                    style={styles.headerImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[styles.headerImagePlaceholder, { backgroundColor: colors.card }]}>
                    <Settings2 size={24} color={colors.subText} strokeWidth={1.5} />
                  </View>
                )}
                <View style={styles.headerTextContainer}>
                  <Text style={[styles.sheetTitle, { color: colors.text }]} numberOfLines={1}>
                    {currentTitle}
                  </Text>
                  <Text style={styles.sheetSubTitle} numberOfLines={1}>
                    Playlist • {songs.length} tracks
                  </Text>
                </View>
              </View>
              <View
                style={[
                  styles.headerSeparator,
                  { backgroundColor: colors.border },
                ]}
              />
            </View>

            <View style={styles.optionsList}>
              {isOwner && (
                <>
                  {renderOptionItem(
                    "Edit Name",
                    Edit3,
                    () => {
                      if (!isOnline) {
                        showOfflineAlert();
                        return;
                      }
                      setShowRenameModal(true);
                    },
                    colors.text,
                    undefined,
                    !isOnline,
                  )}

                  {renderOptionItem(
                    isPublic ? "Make Private" : "Make Public",
                    isPublic ? Lock : Globe,
                    handleTogglePublic,
                    colors.text,
                    isPublic ? "Visible only to you" : "Visible to everyone",
                    !isOnline,
                  )}

                  {renderOptionItem(
                    "Delete Playlist",
                    Trash2,
                    () => {
                      if (!isOnline) {
                        showOfflineAlert();
                        return;
                      }
                      setShowDeleteDialog(true);
                    },
                    colors.error,
                    "Irreversible action",
                    !isOnline,
                  )}
                </>
              )}

              {songs.length > 0 && (
                <>
                  {!allDownloaded
                    ? renderOptionItem(
                        "Download All",
                        Download,
                        handleBulkDownload,
                        colors.text,
                        `${songs.length - downloadedCount} tracks remaining`,
                        !isOnline,
                      )
                    : renderOptionItem(
                        "Clear Downloads",
                        Check,
                        handleBulkDelete,
                        colors.success,
                        `${downloadedCount} tracks saved offline`,
                      )}
                </>
              )}
            </View>

            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.border }]}
              onPress={handleCloseMenu}
            >
              <Text style={[styles.cancelBtnText, { color: colors.text }]}>
                Done
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
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

      {/* 名称変更モーダル */}
      <Modal visible={showRenameModal} transparent animationType="fade">
        <BlurView
          intensity={20}
          tint="dark"
          style={styles.renameOverlay}
          testID="rename-modal"
        >
          <View
            style={[
              styles.renameCard,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
            testID="rename-card"
          >
            <View style={styles.renameHeader}>
              <Text style={[styles.renameTitle, { color: colors.text }]}>
                Rename
              </Text>
              <TouchableOpacity onPress={() => setShowRenameModal(false)}>
                <X size={20} color={colors.subText} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Enter new title"
              placeholderTextColor={colors.subText}
              autoFocus
              selectionColor={colors.primary}
            />

            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary }]}
              onPress={handleRename}
            >
              <Text style={[styles.saveBtnText, { color: colors.primaryDark }]}>
                Update Name
              </Text>
            </TouchableOpacity>
          </View>
        </BlurView>
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
  flex: { flex: 1 },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  overlay: { ...StyleSheet.absoluteFillObject },
  menuButton: {
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  sheet: {
    width: "100%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  sheetHeader: {
    paddingTop: 12,
    paddingBottom: 20,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    marginBottom: 24,
    alignSelf: "center",
  },
  headerInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  headerImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  headerImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: "center",
  },
  sheetTitle: {
    fontSize: 22,
    fontFamily: FONTS.title,
    letterSpacing: 0.5,
  },
  sheetSubTitle: {
    fontSize: 14,
    color: "#A8A29E",
    fontFamily: FONTS.body,
    opacity: 0.7,
    marginTop: 2,
  },
  headerSeparator: {
    height: 1,
    width: "100%",
    marginTop: 20,
    opacity: 0.3,
  },
  optionsList: {
    gap: 8,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  optionItemDisabled: {
    opacity: 0.4,
  },
  optionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  optionTextContainer: {
    flex: 1,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  optionLabel: {
    fontSize: 16,
    fontFamily: FONTS.semibold,
  },
  optionSubLabel: {
    fontSize: 12,
    color: "#A8A29E",
    fontFamily: FONTS.body,
    marginTop: 2,
  },
  cancelBtn: {
    marginTop: 32,
    height: 56,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  cancelBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  // Rename Modal
  renameOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  renameCard: {
    width: "100%",
    borderRadius: 28,
    padding: 24,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  renameHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  renameTitle: {
    fontSize: 20,
    fontFamily: FONTS.title,
  },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: FONTS.body,
    borderWidth: 1,
    marginBottom: 24,
  },
  saveBtn: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  saveBtnText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});
