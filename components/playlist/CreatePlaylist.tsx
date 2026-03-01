import React, { useState, useEffect, memo } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  Dimensions,
  Pressable,
} from "react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import createPlaylist from "@/actions/playlist/createPlaylist";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import Toast from "react-native-toast-message";
import { Plus, X, ListPlus } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

interface CreatePlaylistProps {
  children?: React.ReactNode;
}

function CreatePlaylist({ children }: CreatePlaylistProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [playlistName, setPlaylistName] = useState("");
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();
  const { colors } = useThemeStore();

  // Animation shared values
  const translateY = useSharedValue(SCREEN_HEIGHT);
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (modalOpen) {
      opacity.value = withTiming(1, { duration: 300 });
      translateY.value = withSpring(0, {
        damping: 25,
        stiffness: 80,
      });
    } else {
      opacity.value = withTiming(0, { duration: 200 });
      translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 });
    }
  }, [modalOpen]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const {
    mutate: create,
    error,
    isPending,
  } = useMutation({
    mutationFn: createPlaylist,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.playlists] });
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
  });

  const handleCreatePlaylist = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!playlistName.trim()) {
      Toast.show({
        type: "error",
        text1: "プレイリスト名を入力してください",
      });
      return;
    }

    create(playlistName);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
  };

  // オフライン時はモーダルを開く前にアラートを表示
  const handleOpenModal = () => {
    if (!isOnline) {
      Alert.alert(
        "オフラインです",
        "プレイリストの作成にはインターネット接続が必要です",
        [{ text: "OK" }],
      );
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

      <Modal
        animationType="none"
        transparent={true}
        visible={modalOpen}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalRoot}>
          <Animated.View style={[styles.overlay, overlayStyle]}>
            <Pressable style={styles.flex} onPress={handleCloseModal} />
          </Animated.View>

          <Animated.View
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
              animatedStyle,
            ]}
          >
            <View style={styles.handle} />

            <View style={styles.header}>
              <View style={styles.headerTitleRow}>
                <ListPlus size={22} color={colors.primary} strokeWidth={2} />
                <Text style={[styles.title, { color: colors.text }]}>
                  Create Playlist
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleCloseModal}
                style={[
                  styles.closeIconButton,
                  { backgroundColor: colors.card },
                ]}
              >
                <X size={20} color={colors.text} strokeWidth={1.5} />
              </TouchableOpacity>
            </View>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

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
              {error && <Text style={styles.errorText}>{error.message}</Text>}
            </View>

            <TouchableOpacity
              style={[
                styles.submitButton,
                { backgroundColor: colors.primary },
                isPending && styles.submitButtonDisabled,
              ]}
              onPress={handleCreatePlaylist}
              disabled={isPending}
              testID="create-button"
            >
              <Text style={[styles.submitButtonText, { color: "#fff" }]}>
                {isPending ? "Creating..." : "Create Playlist"}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  modalRoot: { flex: 1, justifyContent: "flex-end" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
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
    width: "100%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    paddingBottom: 48,
    paddingHorizontal: 24,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 20,
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
