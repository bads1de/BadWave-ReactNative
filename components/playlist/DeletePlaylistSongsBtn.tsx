import React, { useState } from "react";
import { TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import deletePlaylistSong from "@/actions/deletePlaylistSong";
import { CACHED_QUERIES } from "@/constants";
import Toast from "react-native-toast-message";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

interface DeletePlaylistSongsBtnProps {
  songId: string;
  playlistId: string;
  songType: string;
}

const DeletePlaylistSongsBtn: React.FC<DeletePlaylistSongsBtnProps> = ({
  songId,
  playlistId,
  songType = "regular",
}) => {
  const queryClient = useQueryClient();
  const [isDeleting, setIsDeleting] = useState(false);
  const { isOnline } = useNetworkStatus();

  const { mutate: deleteSong } = useMutation({
    mutationFn: () => deletePlaylistSong(playlistId, songId, songType),
    onSuccess: () => {
      setIsDeleting(false);
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistSongs, playlistId],
      });

      Toast.show({
        type: "success",
        text1: "曲を削除しました",
      });
    },
    onError: (error: any) => {
      setIsDeleting(false);
      Toast.show({
        type: "error",
        text1: "エラーが発生しました",
        text2: error.message,
      });
    },
  });

  const handleDelete = () => {
    if (isDeleting) {
      return;
    }
    if (!isOnline) {
      Alert.alert(
        "オフラインです",
        "曲の削除にはインターネット接続が必要です",
        [{ text: "OK" }]
      );
      return;
    }
    setIsDeleting(true);
    deleteSong();
  };

  const isDisabled = isDeleting || !isOnline;

  return (
    <TouchableOpacity
      style={[styles.deleteButton, isDisabled && styles.deleteButtonDisabled]}
      onPress={handleDelete}
      disabled={isDisabled}
      testID="delete-playlist-song-button"
    >
      <Ionicons
        name="trash-outline"
        size={20}
        color={isDisabled ? "gray" : "red"}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  deleteButton: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
    padding: 5,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
});

export default DeletePlaylistSongsBtn;
