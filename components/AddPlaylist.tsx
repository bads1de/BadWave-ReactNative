import React, { useState, useEffect, useCallback } from "react";
import {
  TouchableOpacity,
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import Toast from "react-native-toast-message";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import Song, { PlaylistSong, Playlist } from "@/types";
import getPlaylists from "@/actions/getPlaylists";
import addPlaylistSong from "@/actions/addPlaylistSong";
import usePlaylistStatus from "@/hooks/usePlaylistStatus";

interface AddPlaylistProps {
  songId: string;
  children?: React.ReactNode;
}

export default function AddPlaylist({ songId, children }: AddPlaylistProps) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [isAdded, setIsAdded] = useState<Record<string, boolean>>({});

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
  }, [fetchAddedStatus, songId, playlists]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (playlistId: string) => {
      if (!session?.user.id) throw new Error("未認証ユーザー");
      return addPlaylistSong({ playlistId, userId: session.user.id, songId });
    },
    onMutate: async (playlistId) => {
      // 現在のクエリデータをキャンセルしてスナップショットを取得
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.playlistSongs],
      });

      const previousPlaylistSongs = queryClient.getQueryData<PlaylistSong[]>([
        CACHED_QUERIES.playlistSongs,
      ]);

      // 楽観的にキャッシュを更新
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

      // isAddedステートを即時更新
      setIsAdded((prev) => ({ ...prev, [playlistId]: true }));

      return { previousPlaylistSongs };
    },
    onError: (error, playlistId, context) => {
      // エラー発生時に前の状態にロールバック
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
      // 最終的なデータ整合性を保証するために再検証
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistSongs],
      });
    },
  });

  const handleAddToPlaylist = (playlistId: string) => {
    if (!session?.user.id) {
      Toast.show({ type: "error", text1: "not authenticated" });
      return;
    }

    mutate(playlistId);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => {
          if (!session?.user.id) {
            Toast.show({ type: "error", text1: "ログインが必要です" });
            return;
          }
          setModalOpen(true);
        }}
      >
        {children || (
          <Ionicons name="add-circle-outline" size={24} color="white" />
        )}
      </TouchableOpacity>

      <Modal
        visible={modalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setModalOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.header}>
              <Text style={styles.title}>プレイリストに追加</Text>
              <TouchableOpacity onPress={() => setModalOpen(false)}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.scrollView}>
              {playlists.map((playlist) => (
                <TouchableOpacity
                  key={playlist.id}
                  style={[
                    styles.playlistItem,
                    isAdded[playlist.id] && styles.addedPlaylistItem,
                  ]}
                  onPress={() => handleAddToPlaylist(playlist.id)}
                  disabled={isPending || isAdded[playlist.id]}
                >
                  <Ionicons
                    name={isAdded[playlist.id] ? "checkbox" : "square-outline"}
                    size={20}
                    color={isAdded[playlist.id] ? "#4c1d95" : "white"}
                  />
                  <Text
                    style={[
                      styles.playlistName,
                      isAdded[playlist.id] && styles.addedPlaylistName,
                    ]}
                  >
                    {playlist.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
  },
  modalContent: {
    backgroundColor: "#000",
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 15,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#4c1d95",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
  },
  playlistItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#444",
  },
  playlistName: {
    marginLeft: 10,
    fontSize: 16,
    color: "white",
  },
  scrollView: {
    maxHeight: 300,
  },
  addedPlaylistItem: {
    backgroundColor: "rgba(76, 29, 149, 0.1)",
  },
  addedPlaylistName: {
    color: "#aaa",
  },
});
