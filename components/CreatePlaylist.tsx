import React, { useState, memo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "../constants";
import createPlaylist from "../actions/createPlaylist";

import Toast from "react-native-toast-message";

const CreatePlaylist = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const queryClient = useQueryClient();

  const {
    mutate: create,
    error,
    isPending,
  } = useMutation({
    mutationFn: createPlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.playlists] });
      setModalOpen(false);
      setPlaylistName("");

      Toast.show({
        type: "success",
        text1: "プレイリストを作成しました",
      });
    },
    onError: (err) => {
      Toast.show({
        type: "error",
        text1: "通信エラーが発生しました",
        text2: "しばらくしてから再試行してください",
      });
    },
  });

  const handleCreatePlaylist = () => {
    if (!playlistName.trim()) {
      Toast.show({
        type: "error",
        text1: "プレイリスト名を入力してください",
      });
      return;
    }

    create(playlistName);
  };

  return (
    <>
      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setModalOpen(true)}
        testID="create-playlist-button"
      >
        <Text style={styles.createButtonText}>+ New Playlist</Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={modalOpen}
        onRequestClose={() => {
          setModalOpen(false);
        }}
      >
        <View style={styles.centeredView}>
          <View style={styles.modalView}>
            <Text style={styles.modalText}>Enter playlist name:</Text>
            <TextInput
              style={styles.input}
              onChangeText={setPlaylistName}
              value={playlistName}
              placeholder="My Playlist"
              placeholderTextColor="rgba(255,255,255,0.6)"
              testID="playlist-name-input"
            />
            {error && <Text style={styles.errorText}>{error.message}</Text>}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.buttonCancel]}
                onPress={() => {
                  setModalOpen(false);
                  setPlaylistName("");
                }}
                testID="cancel-button"
              >
                <Text style={styles.textStyle}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.buttonCreate]}
                onPress={handleCreatePlaylist}
                disabled={isPending}
                testID="create-button"
              >
                <Text style={styles.textStyle}>
                  {isPending ? "Creating..." : "Create"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  createButton: {
    backgroundColor: "#4c1d95",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  createButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalView: {
    backgroundColor: "#1a1a1a",
    borderRadius: 20,
    padding: 35,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "80%",
  },
  modalText: {
    marginBottom: 15,
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
    width: "100%",
    color: "#fff",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  button: {
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    width: "45%",
  },
  buttonCancel: {
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  buttonCreate: {
    backgroundColor: "#4c1d95",
  },
  textStyle: {
    color: "#fff",
    fontWeight: "bold",
    textAlign: "center",
  },
  errorText: {
    color: "red",
    marginBottom: 15,
    textAlign: "center",
  },
});

// メモ化してエクスポート
export default memo(CreatePlaylist);
