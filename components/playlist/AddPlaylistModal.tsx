import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
  Dimensions,
} from "react-native";
import { useAuth } from "@/providers/AuthProvider";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import Toast from "react-native-toast-message";
import { Check, ListPlus, X } from "lucide-react-native";
import { Playlist } from "@/types";
import usePlaylistStatus from "@/hooks/data/usePlaylistStatus";
import { useGetPlaylists } from "@/hooks/data/useGetPlaylists";
import { useGetLocalSongById } from "@/hooks/data/useGetLocalSongById";
import { useMutatePlaylistSong } from "@/hooks/mutations/useMutatePlaylistSong";
import { FONTS } from "@/constants/theme";
import { ANIMATION_DURATION } from "@/constants";
import BottomSheet from "@/components/common/BottomSheet";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const DEFAULT_PLAYLISTS: Playlist[] = [];

interface AddPlaylistModalProps {
  songId: string;
  currentPlaylistId?: string;
  visible: boolean;
  onClose: () => void;
}

/**
 * プレイリスト追加モーダル本体。
 * BottomSheet の共通スキャフォールドを利用する。
 */
export function AddPlaylistModal({
  songId,
  currentPlaylistId,
  visible,
  onClose,
}: AddPlaylistModalProps) {
  const colors = useThemeStore((state) => state.colors);
  const { session } = useAuth();
  const [optimisticPlaylistIds, setOptimisticPlaylistIds] = useState<string[]>(
    [],
  );

  const { playlists = DEFAULT_PLAYLISTS } = useGetPlaylists(session?.user.id);
  const { addSong } = useMutatePlaylistSong(session?.user.id);
  // 楽観的更新のために実 Song オブジェクトをローカル DB から取得
  const { data: localSong } = useGetLocalSongById(songId);

  const { data: playlistStatus = {}, refetch: fetchAddedStatus } =
    usePlaylistStatus({
      songId,
      playlists,
    });

  // modal は開かれたときのみレンダリングされるため、開時に状態を取り直す
  useEffect(() => {
    fetchAddedStatus();
  }, [fetchAddedStatus]);

  // UI表示用に現在のプレイリストの状態を合成したものを取得
  const displayStatus = useMemo(() => {
    const status = { ...playlistStatus };
    if (currentPlaylistId) {
      status[currentPlaylistId] = true;
    }
    optimisticPlaylistIds.forEach((playlistId: string) => {
      status[playlistId] = true;
    });
    return status;
  }, [playlistStatus, currentPlaylistId, optimisticPlaylistIds]);

  const handleAddToPlaylist = useCallback(
    (playlistId: string) => {
      if (!session?.user.id) {
        Toast.show({
          type: "error",
          text1: "ログインが必要です",
          position: "bottom",
        });
        return;
      }

      if (displayStatus[playlistId]) {
        Toast.show({
          type: "info",
          text1: "追加済みです",
          text2: "この曲は既にプレイリストに追加されています",
          position: "bottom",
        });
        return;
      }

      setOptimisticPlaylistIds((prev) =>
        prev.includes(playlistId) ? prev : [...prev, playlistId],
      );

      addSong.mutate(
        { songId, playlistId, song: localSong ?? undefined },
        {
          onError: (error) => {
            setOptimisticPlaylistIds((prev) =>
              prev.filter((id) => id !== playlistId),
            );
            Toast.show({
              type: "error",
              text1: "エラーが発生しました",
              text2:
                error instanceof Error
                  ? error.message
                  : "曲の追加に失敗しました",
            });
          },
          onSettled: () => {
            fetchAddedStatus();
          },
        },
      );
    },
    [session, addSong, displayStatus, songId, fetchAddedStatus, localSong],
  );

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      overlayColor="rgba(0,0,0,0.6)"
      sheetStyle={styles.sheet}
      animation={{
        openOpacityDuration: ANIMATION_DURATION.normal,
        closeOpacityDuration: ANIMATION_DURATION.fast,
        closeTranslateDuration: ANIMATION_DURATION.normal,
      }}
      footer={
        <TouchableOpacity
          style={[
            styles.closeButton,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
          onPress={onClose}
        >
          <Text style={[styles.closeButtonText, { color: colors.text }]}>
            閉じる
          </Text>
        </TouchableOpacity>
      }
    >
      <View style={styles.header}>
        <View style={styles.headerTitleRow}>
          <ListPlus size={22} color={colors.primary} strokeWidth={2} />
          <Text
            style={[styles.title, { color: colors.text }]}
            testID="modal-title"
          >
            プレイリストに追加
          </Text>
        </View>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.closeIconButton, { backgroundColor: colors.card }]}
          testID="close-button"
        >
          <X size={20} color={colors.text} strokeWidth={1.5} />
        </TouchableOpacity>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border }]} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {playlists.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.subText }]}>
              プレイリストがありません
            </Text>
          </View>
        ) : (
          playlists.map((playlist) => (
            <TouchableOpacity
              key={playlist.id}
              style={[
                styles.playlistItem,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                },
                displayStatus[playlist.id] && {
                  borderColor: colors.primary,
                  backgroundColor: colors.primary + "10",
                },
              ]}
              onPress={() => handleAddToPlaylist(playlist.id)}
              disabled={addSong.isPending || displayStatus[playlist.id]}
              activeOpacity={0.7}
              testID="playlist-item"
            >
              <View style={styles.playlistInfo}>
                <Text
                  style={[
                    styles.playlistName,
                    { color: colors.text },
                    displayStatus[playlist.id] && {
                      color: colors.primary,
                    },
                  ]}
                  numberOfLines={1}
                >
                  {playlist.title}
                </Text>
              </View>

              <View style={styles.statusIcon}>
                {displayStatus[playlist.id] ? (
                  <View
                    style={[
                      styles.checkWrapper,
                      { backgroundColor: colors.primary },
                    ]}
                  >
                    <Check size={14} color="white" strokeWidth={3} />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.uncheckWrapper,
                      { borderColor: colors.border },
                    ]}
                  />
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </BottomSheet>
  );
}

export default AddPlaylistModal;

const styles = StyleSheet.create({
  sheet: {
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontFamily: FONTS.bold,
  },
  closeIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  divider: {
    height: 1,
    marginBottom: 16,
    opacity: 0.5,
  },
  scrollView: {
    maxHeight: 350,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  playlistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  playlistInfo: {
    flex: 1,
  },
  playlistName: {
    fontSize: 16,
    fontFamily: FONTS.semibold,
  },
  statusIcon: {
    marginLeft: 12,
  },
  checkWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  uncheckWrapper: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
  },
  emptyContainer: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    fontFamily: FONTS.body,
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
