import React, { useState } from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import deletePlaylist from "@/actions/deletePlaylist";
import { CACHED_QUERIES } from "@/constants";
import Toast from "react-native-toast-message";
import { useAuth } from "@/providers/AuthProvider";
import { Ionicons } from "@expo/vector-icons";
import CustomAlertDialog from "./CustomAlertDialog";
import { useRouter } from "expo-router";

interface DeletePlaylistButtonProps {
  playlistId: string;
}

export default function DeletePlaylistButton({
  playlistId,
}: DeletePlaylistButtonProps) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { mutate: deleteMutation } = useMutation({
    mutationFn: () => deletePlaylist(playlistId, session?.user.id!),
    onMutate: () => {
      setLoading(true);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.playlists] });
      setLoading(false);

      Toast.show({
        type: "success",
        text1: "プレイリストを削除しました",
      });

      router.push({ pathname: "/library" });
    },
    onError: (err: Error) => {
      setLoading(false);

      Toast.show({
        type: "error",
        text1: "通信エラーが発生しました",
        text2: err.message,
      });
    },
  });

  const handleDelete = () => {
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    setDialogOpen(false);
    deleteMutation();
  };

  const handleCancel = () => {
    setDialogOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={handleDelete}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Ionicons name="trash-bin-outline" size={20} color="red" />
        )}
      </TouchableOpacity>

      <CustomAlertDialog
        visible={dialogOpen}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </>
  );
}

const styles = StyleSheet.create({
  deleteButton: {
    alignItems: "center",
    justifyContent: "center",
  },
});
