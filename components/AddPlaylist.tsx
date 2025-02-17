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
import Song, { PlaylistSong } from "@/types";
import getPlaylists from "@/actions/getPlaylists";
import updatePlaylistImage from "@/actions/updatePlaylistImage";
import getSongById from "@/actions/getSongById";

interface AddPlaylistProps {
  songId: string;
  children?: React.ReactNode;
}

export default function AddPlaylist({ songId, children }: AddPlaylistProps) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [isAdded, setIsAdded] = useState<Record<string, boolean>>({});
  const [modalOpen, setModalOpen] = useState(false);

  const { data: playlists = [] } = useQuery({
    queryKey: [CACHED_QUERIES.playlists],
    queryFn: getPlaylists,
  });

  const fetchAddedStatus = useCallback(async () => {
    if (!session?.user.id) {
      setIsAdded({});
      return;
    }

    try {
      const { data, error } = await supabase
        .from("playlist_songs")
        .select("playlist_id")
        .eq("song_id", songId)
        .eq("user_id", session.user.id)
        .eq("song_type", "regular");

      if (error) {
        throw new Error(error.message);
      }

      const statusMap = playlists.reduce((acc, playlist) => {
        acc[playlist.id] = data.some(
          (item) => item.playlist_id === playlist.id
        );
        return acc;
      }, {} as Record<string, boolean>);

      setIsAdded(statusMap);
    } catch (error: any) {
      console.error("Error fetching playlist status:", error);
      Toast.show({
        type: "error",
        text1: "データの取得に失敗しました",
        text2: error.message,
      });
    }
  }, [session, songId, playlists]);

  useEffect(() => {
    if (modalOpen) {
      fetchAddedStatus();
    }
  }, [modalOpen, fetchAddedStatus]);

  const { mutate, isPending } = useMutation({
    mutationFn: async (playlistId: string) => {
      if (!session?.user.id) throw new Error("未認証ユーザー");

      const { error } = await supabase.from("playlist_songs").insert({
        playlist_id: playlistId,
        user_id: session.user.id,
        song_id: songId,
        song_type: "regular",
      });

      if (error) throw error;

      // 追加した曲の情報を取得
      const songData = await getSongById(songId);

      // プレイリストの画像パスを更新（必要な場合）
      if (songData?.image_path) {
        await updatePlaylistImage(playlistId, songData.image_path);
      }

      return playlistId;
    },
    onMutate: async (playlistId) => {
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.playlistSongs, playlistId],
      });

      const previousData = queryClient.getQueryData<PlaylistSong[]>([
        CACHED_QUERIES.playlistSongs,
        playlistId,
      ]);

      // 楽観的更新
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistSongs, playlistId],
        (old: PlaylistSong[] = []) => [
          ...old,
          {
            ...queryClient.getQueryData<Song>([CACHED_QUERIES.songs, songId]),
            playlist_id: playlistId,
            song_type: "regular",
          },
        ]
      );

      setIsAdded((prev) => ({ ...prev, [playlistId]: true }));

      Toast.show({
        type: "success",
        text1: "プレイリストに追加しました",
      });

      return { previousData, playlistId };
    },
    onError: (error: any, playlistId, context) => {
      console.error("プレイリスト追加エラー:", error);
      Toast.show({
        type: "error",
        text1: "追加に失敗しました",
        text2: error.message,
      });

      // ロールバック時にpreviousDataがundefinedの場合の処理を追加
      if (context?.previousData) {
        queryClient.setQueryData(
          [CACHED_QUERIES.playlistSongs, context.playlistId],
          context.previousData
        );
      } else {
        // previousDataがない場合の代替処理（例：キャッシュを再取得）
        queryClient.invalidateQueries({
          queryKey: [CACHED_QUERIES.playlistSongs, playlistId],
        });
      }
      setIsAdded((prev) => ({ ...prev, [playlistId]: false }));
    },
    onSettled: (data, error, playlistId) => {
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistSongs, playlistId],
      });
    },
  });

  const handleAddToPlaylist = (playlistId: string) => {
    if (!session?.user.id) {
      Toast.show({ type: "error", text1: "ログインが必要です" });
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
