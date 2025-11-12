import React, { useState } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import deletePlaylistSong from "@/actions/deletePlaylistSong";
import { CACHED_QUERIES } from "@/constants";
import Toast from "react-native-toast-message";

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
    setIsDeleting(true);
    deleteSong();
  };

  return (
    <TouchableOpacity
      style={styles.deleteButton}
      onPress={handleDelete}
      disabled={isDeleting}
      testID="delete-playlist-song-button"
    >
      <Ionicons
        name="trash-outline"
        size={20}
        color={isDeleting ? "gray" : "red"}
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
});

export default DeletePlaylistSongsBtn;
