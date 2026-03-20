import React, { useState } from "react";
import { TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Toast from "react-native-toast-message";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useAuth } from "@/providers/AuthProvider";
import { useMutatePlaylistSong } from "@/hooks/mutations/useMutatePlaylistSong";

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
  const [isDeleting, setIsDeleting] = useState(false);
  const { isOnline } = useNetworkStatus();
  const { session } = useAuth();
  const { removeSong } = useMutatePlaylistSong(session?.user?.id);

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
    removeSong.mutate(
      { playlistId, songId },
      {
        onSuccess: () => {
          setIsDeleting(false);
          Toast.show({
            type: "success",
            text1: "曲を削除しました",
          });
        },
        onError: (error: Error) => {
          setIsDeleting(false);
          Toast.show({
            type: "error",
            text1: "エラーが発生しました",
            text2: error.message,
          });
        },
      },
    );
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

