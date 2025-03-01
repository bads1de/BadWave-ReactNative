import React, { useState, useEffect } from "react";
import {
  TouchableOpacity,
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableWithoutFeedback,
  Animated,
  Dimensions,
} from "react-native";
import { useAuth } from "@/providers/AuthProvider";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { PlaylistSong } from "@/types";
import getPlaylists from "@/actions/getPlaylists";
import addPlaylistSong from "@/actions/addPlaylistSong";
import usePlaylistStatus from "@/hooks/usePlaylistStatus";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

interface AddPlaylistProps {
  songId: string;
  children?: React.ReactNode;
}

export default function AddPlaylist({ songId, children }: AddPlaylistProps) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [isAdded, setIsAdded] = useState<Record<string, boolean>>({});
  const [animation] = useState(new Animated.Value(0));
  const { width } = Dimensions.get("window");

  const { data: playlists = [] } = useQuery({
    queryKey: [CACHED_QUERIES.playlists],
    queryFn: getPlaylists,
  });

  const { isAdded: queryAddedStatus, fetchAddedStatus } = usePlaylistStatus({
    songId,
    playlists,
  });

  useEffect(() => {
    fetchAddedStatus();
  }, [songId]);

  useEffect(() => {
    if (modalOpen) {
      Animated.spring(animation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      Animated.timing(animation, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [modalOpen, animation]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (playlistId: string) => {
      if (!session?.user.id) throw new Error("未認証ユーザー");
      return addPlaylistSong({ playlistId, userId: session.user.id, songId });
    },
    onMutate: async (playlistId) => {
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.playlistSongs],
      });

      const previousPlaylistSongs = queryClient.getQueryData<PlaylistSong[]>([
        CACHED_QUERIES.playlistSongs,
      ]);

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

      setIsAdded((prev) => ({ ...prev, [playlistId]: true }));

      return { previousPlaylistSongs };
    },
    onError: (error, playlistId, context) => {
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistSongs],
        context?.previousPlaylistSongs
      );
      setIsAdded((prev) => ({ ...prev, [playlistId]: false }));

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
    },
  });

  const handleAddToPlaylist = (playlistId: string) => {
    if (!session?.user.id) {
      Toast.show({
        type: "error",
        text1: "ログインが必要です",
        position: "bottom",
      });
      return;
    }

    // アニメーション効果付きで追加
    Animated.sequence([
      Animated.timing(new Animated.Value(0), {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(new Animated.Value(1), {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    mutate(playlistId);
  };

  const modalScale = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.8, 1],
  });

  const modalOpacity = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          if (!session?.user.id) {
            Toast.show({
              type: "error",
              text1: "ログインが必要です",
              position: "bottom",
            });
            return;
          }
          setModalOpen(true);
        }}
        style={styles.addButton}
      >
        {children || (
          <LinearGradient
            colors={["#8b5cf6", "#4c1d95"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            <Ionicons name="add" size={16} color="white" />
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
          <BlurView intensity={60} style={styles.modalOverlay} tint="dark">
            <TouchableWithoutFeedback>
              <Animated.View
                style={[
                  styles.modalContent,
                  {
                    transform: [{ scale: modalScale }],
                    opacity: modalOpacity,
                    width: width * 0.85,
                  },
                ]}
              >
                <LinearGradient
                  colors={["rgba(30, 30, 40, 0.95)", "rgba(15, 15, 25, 0.97)"]}
                  style={styles.modalGradient}
                >
                  <View style={styles.header}>
                    <Text style={styles.title}>プレイリストに追加</Text>
                    <TouchableOpacity
                      onPress={() => setModalOpen(false)}
                      style={styles.closeButton}
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
                          isAdded[playlist.id] && styles.addedPlaylistItem,
                          index === playlists.length - 1 &&
                            styles.lastPlaylistItem,
                        ]}
                        onPress={() => handleAddToPlaylist(playlist.id)}
                        disabled={isPending || isAdded[playlist.id]}
                        activeOpacity={0.7}
                      >
                        <View style={styles.checkboxContainer}>
                          {isAdded[playlist.id] ? (
                            <LinearGradient
                              colors={["#8b5cf6", "#4c1d95"]}
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
                            isAdded[playlist.id] && styles.addedPlaylistName,
                          ]}
                        >
                          {playlist.title}
                        </Text>
                        {isAdded[playlist.id] && (
                          <Text style={styles.addedText}>追加済み</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </LinearGradient>
              </Animated.View>
            </TouchableWithoutFeedback>
          </BlurView>
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
  gradientButton: {
    width: 24,
    height: 24,
    borderRadius: 21,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#4c1d95",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
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
