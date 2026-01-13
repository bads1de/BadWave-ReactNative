import React, { useState, useEffect, memo, useCallback, useMemo } from "react";
import {
  TouchableOpacity,
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Dimensions,
  Alert,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useAuth } from "@/providers/AuthProvider";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { PlaylistSong, Playlist } from "@/types";
import getPlaylists from "@/actions/getPlaylists";
import addPlaylistSong from "@/actions/addPlaylistSong";
import usePlaylistStatus from "@/hooks/data/usePlaylistStatus";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { LinearGradient } from "expo-linear-gradient";

interface AddPlaylistProps {
  songId: string;
  children?: React.ReactNode;
  currentPlaylistId?: string;
}

const DEFAULT_PLAYLISTS: Playlist[] = [];

const hexToRgba = (hex: string, alpha: number) => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

function AddPlaylist({
  songId,
  children,
  currentPlaylistId,
}: AddPlaylistProps) {
  const queryClient = useQueryClient();
  const { colors } = useThemeStore();
  const { session } = useAuth();
  const { isOnline } = useNetworkStatus();
  const [modalOpen, setModalOpen] = useState(false);
  const animation = useSharedValue(0);
  const { width } = Dimensions.get("window");

  const { data: playlists = DEFAULT_PLAYLISTS } = useQuery({
    queryKey: [CACHED_QUERIES.playlists],
    queryFn: getPlaylists,
  });

  const { data: playlistStatus = {}, refetch: fetchAddedStatus } =
    usePlaylistStatus({
      songId,
      playlists,
    });

  useEffect(() => {
    if (modalOpen) {
      animation.value = withSpring(1, {
        damping: 8,
        stiffness: 50,
      });
    } else {
      animation.value = withTiming(0, { duration: 200 });
    }
  }, [modalOpen, animation]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (playlistId: string) => {
      if (!session?.user.id) throw new Error("未認証ユーザー");

      return addPlaylistSong({ playlistId, userId: session.user.id, songId });
    },
    onMutate: async (playlistId) => {
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
        ]
      );

      // Optimistically update playlistStatus (Cache is string[])
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistStatus, songId],
        (old: string[] = []) => [...old, playlistId]
      );

      return { previousPlaylistSongs, previousStatus };
    },
    onError: (error, playlistId, context) => {
      // Rollback
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistSongs],
        context?.previousPlaylistSongs
      );
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistStatus, songId],
        context?.previousStatus
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
        Toast.show({
          type: "info",
          text1: "追加済みです",
          text2: "この曲は既にプレイリストに追加されています",
          position: "bottom",
        });
        return;
      }

      // アニメーション効果付きで追加
      // 注: このアニメーションは実際には効果がありません（新しいAnimated.Valueを作成しているため）
      // 必要に応じて、別の方法でアニメーション効果を実装してください

      mutate(playlistId);
    },
    [session, mutate, displayStatus]
  );

  const animatedStyle = useAnimatedStyle(() => {
    const modalScale = interpolate(
      animation.value,
      [0, 1],
      [0.8, 1],
      Extrapolation.CLAMP
    );

    const modalOpacity = interpolate(
      animation.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP
    );

    return {
      transform: [{ scale: modalScale }],
      opacity: modalOpacity,
    };
  });

  // オフライン時またはミューテーション中は無効化
  const isDisabled = !isOnline;

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          if (!isOnline) {
            Alert.alert(
              "オフラインです",
              "プレイリストへの曲の追加にはインターネット接続が必要です",
              [{ text: "OK" }]
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
          // Refresh playlist status when opening modal
          fetchAddedStatus();
          setModalOpen(true);
        }}
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
            <Ionicons
              name="add"
              size={16}
              color={isDisabled ? "rgba(255,255,255,0.4)" : "white"}
            />
          </LinearGradient>
        )}
      </TouchableOpacity>

      <Modal
        visible={modalOpen}
        animationType="none"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalContent,
                  animatedStyle,
                  {
                    width: width * 0.85,
                  },
                ]}
              >
                <LinearGradient
                  colors={["#1e1e28", "#15151b"]}
                  style={styles.modalGradient}
                >
                  <View style={styles.header}>
                    <Text style={styles.title} testID="modal-title">
                      プレイリストに追加
                    </Text>
                    <TouchableOpacity
                      onPress={() => setModalOpen(false)}
                      style={styles.closeButton}
                      testID="close-button"
                    >
                      <Ionicons
                        name="close"
                        size={22}
                        color="rgba(255,255,255,0.8)"
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.divider} />

                  <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.scrollContent}
                  >
                    {playlists.map((playlist, index) => (
                      <TouchableOpacity
                        key={playlist.id}
                        style={[
                          styles.playlistItem,
                          displayStatus[playlist.id] && {
                            backgroundColor: hexToRgba(colors.primary, 0.1),
                            borderWidth: 1,
                            borderColor: hexToRgba(colors.primary, 0.2),
                          },
                          index === playlists.length - 1 &&
                            styles.lastPlaylistItem,
                        ]}
                        onPress={() => handleAddToPlaylist(playlist.id)}
                        disabled={isPending || displayStatus[playlist.id]}
                        activeOpacity={0.7}
                        testID="playlist-item"
                      >
                        <View style={styles.checkboxContainer}>
                          {displayStatus[playlist.id] ? (
                            <LinearGradient
                              colors={[colors.primary, colors.primaryDark]}
                              style={styles.checkboxGradient}
                            >
                              <Ionicons
                                name="checkmark"
                                size={16}
                                color="white"
                              />
                            </LinearGradient>
                          ) : (
                            <View style={styles.checkbox}>
                              <View style={styles.innerCheckbox} />
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            styles.playlistName,
                            displayStatus[playlist.id] && {
                              color: colors.primary,
                              fontWeight: "600",
                            },
                          ]}
                        >
                          {playlist.title}
                        </Text>
                        {displayStatus[playlist.id] && (
                          <Text
                            style={[
                              styles.addedText,
                              { color: hexToRgba(colors.primary, 0.8) },
                            ]}
                          >
                            追加済み
                          </Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </LinearGradient>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    borderRadius: 24,
    overflow: "hidden",
  },
  modalGradient: {
    padding: 0,
    borderRadius: 24,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
    letterSpacing: 0.5,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 8,
  },
  scrollView: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  playlistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    marginVertical: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  lastPlaylistItem: {
    marginBottom: 8,
  },
  checkboxContainer: {
    marginRight: 14,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  innerCheckbox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  checkboxGradient: {
    width: 22,
    height: 22,
    borderRadius: 6,
    justifyContent: "center",
    alignItems: "center",
  },
  playlistName: {
    fontSize: 16,
    fontWeight: "500",
    color: "rgba(255,255,255,0.9)",
    flex: 1,
  },
  addedPlaylistItem: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(139, 92, 246, 0.2)",
  },
  addedPlaylistName: {
    color: "#8b5cf6",
    fontWeight: "600",
  },
  addedText: {
    fontSize: 12,
    color: "rgba(139, 92, 246, 0.8)",
    fontWeight: "500",
    marginLeft: 8,
  },
});

// カスタム比較関数を使用してメモ化
export default memo(AddPlaylist, (prevProps, nextProps) => {
  return (
    prevProps.songId === nextProps.songId &&
    prevProps.currentPlaylistId === nextProps.currentPlaylistId
  );
});

