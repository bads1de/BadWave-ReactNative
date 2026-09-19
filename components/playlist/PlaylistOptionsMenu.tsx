import React, { useState } from "react";
import { Alert, StyleSheet, TouchableOpacity } from "react-native";
import { Settings2 } from "lucide-react-native";

import { useAuth } from "@/providers/AuthProvider";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import Toast from "react-native-toast-message";
import { useRouter } from "expo-router";
import CustomAlertDialog from "@/components/common/CustomAlertDialog";
import { useBulkDownload } from "@/hooks/downloads/useBulkDownload";
import { BulkDownloadModal } from "@/components/download/BulkDownloadModal";
import { useMutatePlaylist } from "@/hooks/mutations/useMutatePlaylist";
import PlaylistOptionsSheet from "@/components/playlist/PlaylistOptionsSheet";
import RenamePlaylistModal from "@/components/playlist/RenamePlaylistModal";
import Song from "@/types";
import { ROUTES } from "@/constants";

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
  const { session } = useAuth();
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const colors = useThemeStore((state) => state.colors);
  const { togglePublic, remove, rename } = useMutatePlaylist(session?.user.id);

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

  const handleOpenMenu = () => {
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

  const handleDeleteConfirm = () => {
    if (!isOnline) {
      showOfflineAlert();
      return;
    }
    setShowDeleteDialog(false);
    remove.mutate(
      { playlistId },
      {
        onSuccess: () => {
          Toast.show({ type: "success", text1: "Playlist deleted" });
          router.push({ pathname: ROUTES.library });
        },
        onError: (err: Error) => {
          Toast.show({ type: "error", text1: "Error", text2: err.message });
        },
      },
    );
  };

  const handleRename = (title: string) => {
    if (!isOnline) {
      showOfflineAlert();
      setShowRenameModal(false);
      return;
    }
    if (title.trim()) {
      rename.mutate(
        { playlistId, title },
        {
          onSuccess: () => {
            Toast.show({ type: "success", text1: "Playlist renamed" });
            setShowRenameModal(false);
            handleCloseMenu();
          },
          onError: (err: Error) => {
            Toast.show({ type: "error", text1: "Error", text2: err.message });
          },
        },
      );
    }
  };

  const handleTogglePublic = () => {
    if (!isOnline) {
      showOfflineAlert();
      return;
    }
    togglePublic.mutate(
      { playlistId, isPublic: !isPublic },
      {
        onSuccess: () => {
          Toast.show({
            type: "success",
            text1: isPublic
              ? "Playlist is now private"
              : "Playlist is now public",
          });
          handleCloseMenu();
        },
        onError: (err: Error) => {
          Toast.show({ type: "error", text1: "Error", text2: err.message });
        },
      },
    );
  };

  const handleEditName = () => {
    if (!isOnline) {
      showOfflineAlert();
      return;
    }
    setShowRenameModal(true);
  };

  const handleRequestDelete = () => {
    if (!isOnline) {
      showOfflineAlert();
      return;
    }
    setShowDeleteDialog(true);
  };

  const handleBulkDownload = () => {
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
    handleCloseMenu();
    setBulkMode("delete");
    setShowBulkModal(true);
    startDelete();
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

      <PlaylistOptionsSheet
        visible={showOptionsModal}
        onClose={handleCloseMenu}
        currentTitle={currentTitle}
        songs={songs}
        isOwner={isOwner}
        isPublic={isPublic}
        isOnline={isOnline}
        allDownloaded={allDownloaded}
        downloadedCount={downloadedCount}
        onEditName={handleEditName}
        onTogglePublic={handleTogglePublic}
        onRequestDelete={handleRequestDelete}
        onBulkDownload={handleBulkDownload}
        onBulkDelete={handleBulkDelete}
      />

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
      <RenamePlaylistModal
        visible={showRenameModal}
        currentTitle={currentTitle}
        onClose={() => setShowRenameModal(false)}
        onSave={handleRename}
      />

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
    padding: 10,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
});
