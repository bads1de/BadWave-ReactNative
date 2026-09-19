import React, { useState, memo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useAuth } from "@/providers/AuthProvider";
import { useCreatePlaylist } from "@/hooks/mutations/useCreatePlaylist";
import Toast from "react-native-toast-message";
import { Plus, X, ListPlus } from "lucide-react-native";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";
import { ANIMATION_DURATION } from "@/constants";
import BottomSheet from "@/components/common/BottomSheet";

interface CreatePlaylistProps {
  children?: React.ReactNode;
}

function CreatePlaylist({ children }: CreatePlaylistProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const { session } = useAuth();
  const { isOnline } = useNetworkStatus();
  const colors = useThemeStore((state) => state.colors);

  const createPlaylist = useCreatePlaylist(session?.user?.id);

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  const handleCreatePlaylist = () => {
    if (!playlistName.trim()) {
      Toast.show({
        type: "error",
        text1: "プレイリスト名を入力してください",
      });
      return;
    }

    createPlaylist.mutate(
      { title: playlistName },
      {
        onSuccess: () => {
          handleCloseModal();
          setPlaylistName("");
          Toast.show({
            type: "success",
            text1: "プレイリストを作成しました",
          });
        },
        onError: () => {
          Toast.show({
            type: "error",
            text1: "通信エラーが発生しました",
            text2: "しばらくしてから再試行してください",
          });
        },
      },
    );
  };

  const handleOpenModal = () => {
    if (!isOnline) {
      Alert.alert(
        "オフラインです",
        "プレイリストの作成にはインターネット接続が必要です",
        [{ text: "OK" }],
      );
      return;
    }
    setModalOpen(true);
  };

  return (
    <>
      {children ? (
        <TouchableOpacity onPress={handleOpenModal} activeOpacity={0.7}>
          {children}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[
            styles.createButton,
            { backgroundColor: colors.primary },
            !isOnline && styles.createButtonDisabled,
          ]}
          onPress={handleOpenModal}
          testID="create-playlist-button"
        >
          <Plus size={18} color="#fff" strokeWidth={2.5} />
          <Text
            style={[
              styles.createButtonText,
              { color: "#fff" },
              !isOnline && styles.createButtonTextDisabled,
            ]}
          >
            New Playlist
          </Text>
        </TouchableOpacity>
      )}

      <BottomSheet
        visible={modalOpen}
        onClose={handleCloseModal}
        overlayColor="rgba(0,0,0,0.6)"
        sheetStyle={styles.sheet}
        animation={{
          openOpacityDuration: ANIMATION_DURATION.normal,
          closeOpacityDuration: ANIMATION_DURATION.fast,
          closeTranslateDuration: ANIMATION_DURATION.normal,
        }}
      >
        <View style={styles.header}>
          <View style={styles.headerTitleRow}>
            <ListPlus size={22} color={colors.primary} strokeWidth={2} />
            <Text style={[styles.title, { color: colors.text }]}>
              Create Playlist
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleCloseModal}
            style={[styles.closeIconButton, { backgroundColor: colors.card }]}
          >
            <X size={20} color={colors.text} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.content}>
          <Text style={[styles.label, { color: colors.subText }]}>
            Playlist Name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.text,
              },
            ]}
            onChangeText={setPlaylistName}
            value={playlistName}
            placeholder="My Awesome Playlist"
            placeholderTextColor={colors.subText + "80"}
            autoFocus
            testID="playlist-name-input"
            selectionColor={colors.primary}
          />
          {createPlaylist.error && (
            <Text style={styles.errorText}>{createPlaylist.error.message}</Text>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.submitButton,
            { backgroundColor: colors.primary },
            createPlaylist.isPending && styles.submitButtonDisabled,
          ]}
          onPress={handleCreatePlaylist}
          disabled={createPlaylist.isPending}
          testID="create-button"
        >
          <Text style={[styles.submitButtonText, { color: "#fff" }]}>
            {createPlaylist.isPending ? "Creating..." : "Create Playlist"}
          </Text>
        </TouchableOpacity>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  createButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignSelf: "flex-start",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  createButtonTextDisabled: {
    color: "rgba(255,255,255,0.5)",
  },
  sheet: {
    paddingBottom: 48,
    paddingHorizontal: 24,
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
    fontSize: 22,
    fontFamily: FONTS.title,
    letterSpacing: 0.5,
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
    marginBottom: 24,
    opacity: 0.3,
  },
  content: {
    marginBottom: 32,
  },
  label: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 56,
    borderRadius: 16,
    paddingHorizontal: 20,
    fontSize: 16,
    fontFamily: FONTS.body,
    borderWidth: 1,
  },
  errorText: {
    color: "#ef4444",
    marginTop: 8,
    fontSize: 14,
    fontFamily: FONTS.body,
    marginLeft: 4,
  },
  submitButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
});

export default memo(CreatePlaylist);
