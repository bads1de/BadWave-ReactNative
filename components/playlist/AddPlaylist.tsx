import React, { useState, useEffect, memo, useCallback, useMemo } from "react";
import {
  TouchableOpacity,
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import { useAuth } from "@/providers/AuthProvider";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import Toast from "react-native-toast-message";
import { Plus, Check, X, ListPlus } from "lucide-react-native";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { PlaylistSong, Playlist } from "@/types";
import getPlaylists from "@/actions/playlist/getPlaylists";
import addPlaylistSong from "@/actions/playlist/addPlaylistSong";
import usePlaylistStatus from "@/hooks/data/usePlaylistStatus";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { LinearGradient } from "expo-linear-gradient";
import { FONTS } from "@/constants/theme";
import * as Haptics from "expo-haptics";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface AddPlaylistProps {
  songId: string;
  children?: React.ReactNode;
  currentPlaylistId?: string;
}

const DEFAULT_PLAYLISTS: Playlist[] = [];

function AddPlaylist({
  songId,
  children,
  currentPlaylistId,
}: AddPlaylistProps) {
  const queryClient = useQueryClient();
  const colors = useThemeStore((state) => state.colors);
  const { session } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [modalOpen, setModalOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  // Animation shared values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (modalOpen) {
      setShouldRender(true);
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 80,
      });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
      const timeout = setTimeout(() => {
        setShouldRender(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [modalOpen, opacity, translateY]);

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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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
          modalOpen={modalOpen}
          handleCloseModal={handleCloseModal}
          translateY={translateY}
          opacity={opacity}
        />
      )}
    </>
  );
}

function AddPlaylistModal({
  songId,
  currentPlaylistId,
  modalOpen,
  handleCloseModal,
  translateY,
  opacity,
}: any) {
  const queryClient = useQueryClient();
  const colors = useThemeStore((state) => state.colors);
  const { session } = useAuth();

  const { data: playlists = DEFAULT_PLAYLISTS } = useQuery({
    queryKey: [CACHED_QUERIES.playlists],
    queryFn: getPlaylists,
  });

  const { data: playlistStatus = {}, refetch: fetchAddedStatus } =
    usePlaylistStatus({
      songId,
      playlists,
    });

  // modalOpen is true initially here since it's only rendered when opened
  useEffect(() => {
    fetchAddedStatus();
  }, [fetchAddedStatus]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (playlistId: string) => {
      if (!session?.user.id) throw new Error("未認証ユーザー");

      return addPlaylistSong({ playlistId, userId: session.user.id, songId });
    },
    onMutate: async (playlistId) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.playlistSongs],
      });
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.playlistStatus, songId],
      });

      // Snapshot the previous values
      const previousPlaylistSongs = queryClient.getQueryData<PlaylistSong[]>([
        CACHED_QUERIES.playlistSongs,
      ]);
      const previousStatus = queryClient.getQueryData<string[]>([
        CACHED_QUERIES.playlistStatus,
        songId,
      ]);

      // Optimistically update playlistSongs
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistSongs],
        (old: PlaylistSong[] = []) => [
          ...old,
          {
            playlist_id: playlistId,
            song_id: songId,
            user_id: session?.user.id,
            created_at: new Date().toISOString(),
            song_type: "regular",
          },
        ],
      );

      // Optimistically update playlistStatus (Cache is string[])
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistStatus, songId],
        (old: string[] = []) => [...old, playlistId],
      );

      return { previousPlaylistSongs, previousStatus };
    },
    onError: (error, playlistId, context) => {
      // Rollback
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistSongs],
        context?.previousPlaylistSongs,
      );
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistStatus, songId],
        context?.previousStatus,
      );

      Toast.show({
        type: "error",
        text1: "エラーが発生しました",
        text2: error.message,
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistSongs],
      });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlists],
      });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistStatus, songId],
      });
    },
  });

  // UI表示用に現在のプレイリストの状態を合成したものを取得
  const displayStatus = useMemo(() => {
    const status = { ...playlistStatus };
    if (currentPlaylistId) {
      status[currentPlaylistId] = true;
    }
    return status;
  }, [playlistStatus, currentPlaylistId]);

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

      // Check if the song is already added to this playlist
      if (displayStatus[playlistId]) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Toast.show({
          type: "info",
          text1: "追加済みです",
          text2: "この曲は既にプレイリストに追加されています",
          position: "bottom",
        });
        return;
      }

      mutate(playlistId);
    },
    [session, mutate, displayStatus],
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Modal
      visible={modalOpen}
      animationType="none"
      transparent
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
              onPress={handleCloseModal}
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
                  disabled={isPending || displayStatus[playlist.id]}
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

const styles = StyleSheet.create({
  flex: { flex: 1 },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
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
  sheet: {
    width: "100%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: SCREEN_HEIGHT * 0.8,
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

// カスタム比較関数を使用してメモ化
export default memo(AddPlaylist, (prevProps, nextProps) => {
  return (
    prevProps.songId === nextProps.songId &&
    prevProps.currentPlaylistId === nextProps.currentPlaylistId
  );
});
