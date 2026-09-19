import React, { useState, useEffect, memo } from "react";
import { TouchableOpacity, StyleSheet, Alert } from "react-native";
import { useAuth } from "@/providers/AuthProvider";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import Toast from "react-native-toast-message";
import { Plus } from "lucide-react-native";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { LinearGradient } from "expo-linear-gradient";
import AddPlaylistModal from "@/components/playlist/AddPlaylistModal";

interface AddPlaylistProps {
  songId: string;
  children?: React.ReactNode;
  currentPlaylistId?: string;
}

function AddPlaylist({
  songId,
  children,
  currentPlaylistId,
}: AddPlaylistProps) {
  const colors = useThemeStore((state) => state.colors);
  const { session } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [modalOpen, setModalOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // 閉じるアニメーション完了後にマウントを解除するための遅延
  useEffect(() => {
    if (modalOpen) {
      setShouldRender(true);
    } else {
      const timeout = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [modalOpen]);

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleOpenModal = () => {
    if (!isOnline) {
      Alert.alert(
        "オフラインです",
        "プレイリストへの曲の追加にはインターネット接続が必要です",
        [{ text: "OK" }],
      );
      return;
    }
    if (!session?.user.id) {
      Toast.show({
        type: "error",
        text1: "ログインが必要です",
        position: "bottom",
      });
      return;
    }
    setModalOpen(true);
  };

  // オフライン時またはミューテーション中は無効化
  const isDisabled = !isOnline;

  return (
    <>
      <TouchableOpacity
        onPress={handleOpenModal}
        style={[styles.addButton, isDisabled && styles.addButtonDisabled]}
        testID="add-playlist-button"
      >
        {children || (
          <LinearGradient
            colors={
              isDisabled
                ? ["#3d3d3d", "#2d2d2d"]
                : [colors.primary, colors.primaryDark]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <Plus
              size={16}
              color={isDisabled ? "rgba(255,255,255,0.4)" : "white"}
            />
          </LinearGradient>
        )}
      </TouchableOpacity>

      {shouldRender && (
        <AddPlaylistModal
          songId={songId}
          currentPlaylistId={currentPlaylistId}
          visible={modalOpen}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  addButton: {
    borderRadius: 50,
    overflow: "hidden",
  },
  addButtonDisabled: {
    opacity: 0.6,
  },
  gradientButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
});

// カスタム比較関数を使用してメモ化
export default memo(AddPlaylist, (prevProps, nextProps) => {
  return (
    prevProps.songId === nextProps.songId &&
    prevProps.currentPlaylistId === nextProps.currentPlaylistId
  );
});
