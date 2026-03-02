import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Image } from "expo-image";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";

import Song from "@/types";
import { useAuth } from "@/providers/AuthProvider";
import { usePlayControls } from "@/hooks/audio/useAudioPlayer";
import { useHeaderStore } from "@/hooks/stores/useHeaderStore";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import ListItem from "@/components/item/ListItem";
import Loading from "@/components/common/Loading";
import Error from "@/components/common/Error";
import PlaylistOptionsMenu from "@/components/playlist/PlaylistOptionsMenu";
import BackButton from "@/components/common/BackButton";
import { useGetPlaylistSongs } from "@/hooks/data/useGetPlaylistSongs";
import { useGetLocalPlaylist } from "@/hooks/data/useGetLocalPlaylist";
import { useMutatePlaylistSong } from "@/hooks/mutations/useMutatePlaylistSong";
import { useOfflineGuard } from "@/hooks/common/useOfflineGuard";
import { FONTS } from "@/constants/theme";

const { width } = Dimensions.get("window");

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const { playlistId } = useLocalSearchParams<{ playlistId: string }>();
  const { session } = useAuth();
  const colors = useThemeStore((state) => state.colors);
  const setShowHeader = useHeaderStore((state) => state.setShowHeader);

  useFocusEffect(
    useCallback(() => {
      setShowHeader(false);
      return () => {
        setShowHeader(true);
      };
    }, [setShowHeader]),
  );

  // ローカルファースト同期データの取得
  const {
    songs: playlistSongs = [],
    isLoading,
    error,
  } = useGetPlaylistSongs(playlistId);

  const {
    playlist,
    isLoading: isLoadingPlaylist,
    error: playlistError,
  } = useGetLocalPlaylist(playlistId);

  // プレイリスト編集フック（削除用）- オンライン必須
  const { removeSong } = useMutatePlaylistSong(session?.user?.id);
  const { guardAction } = useOfflineGuard();

  // 曲削除ハンドラ（オフラインガード付き）
  const handleDeleteSong = useCallback(
    (song: Song) => {
      const action = async () => {
        try {
          await removeSong.mutateAsync({ songId: song.id, playlistId });
          Toast.show({
            type: "success",
            text1: "曲を削除しました",
          });
        } catch (error: any) {
          Toast.show({
            type: "error",
            text1: "エラーが発生しました",
            text2: error.message,
          });
        }
      };
      guardAction(
        action,
        "プレイリストの編集にはインターネット接続が必要です",
      )();
    },
    [removeSong, playlistId, guardAction],
  );

  const { togglePlayPause } = usePlayControls(
    playlistSongs,
    "playlist",
    playlistId,
  );

  // 曲をクリックしたときのハンドラをメモ化
  const handleSongPress = useCallback(
    async (song: Song) => {
      await togglePlayPause(song);
    },
    [togglePlayPause],
  );

  const renderSongs = useCallback(
    ({ item }: { item: Song }) => (
      <ListItem
        song={item}
        onPress={handleSongPress}
        imageSize="medium"
        showStats={true}
        onDelete={
          session?.user.id === playlist?.user_id ? handleDeleteSong : undefined
        }
        currentPlaylistId={playlistId}
      />
    ),
    [
      handleSongPress,
      session?.user.id,
      playlist?.user_id,
      handleDeleteSong,
      playlistId,
    ],
  );

  // keyExtractor関数をメモ化
  const keyExtractor = useCallback((item: Song) => item.id, []);

  // renderHeader関数をメモ化
  const renderHeader = useCallback(
    () => (
      <View style={styles.header}>
        <View style={styles.thumbnailContainer}>
          <Image
            source={{ uri: playlist?.image_path }}
            style={styles.thumbnail}
            contentFit="cover"
            cachePolicy="disk"
          />
          <LinearGradient
            colors={["transparent", "rgba(10,10,10,0.4)", colors.background]}
            style={styles.thumbnailGradient}
          />

          {/* 戻るボタン */}
          <BackButton
            onPress={() => router.push("/library")}
            style={styles.backButton}
          />
        </View>

        <View style={styles.infoWrapper}>
          <BlurView
            intensity={25}
            tint="dark"
            style={[styles.infoContainer, { borderColor: colors.border }]}
          >
            <View style={styles.titleRow}>
              <Text
                style={[styles.title, { color: colors.text }]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {playlist?.title}
              </Text>
              {playlist?.is_public ? (
                <View
                  style={[
                    styles.privacyBadge,
                    {
                      borderColor: colors.glow,
                      backgroundColor: colors.glow + "10",
                    },
                  ]}
                >
                  <Ionicons
                    name="globe-outline"
                    size={12}
                    color={colors.text}
                  />
                  <Text style={[styles.privacyText, { color: colors.text }]}>
                    Public
                  </Text>
                </View>
              ) : (
                <View
                  style={[
                    styles.privacyBadge,
                    {
                      borderColor: colors.border,
                      backgroundColor: "rgba(255,255,255,0.03)",
                    },
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={12}
                    color={colors.subText}
                  />
                  <Text style={[styles.privacyText, { color: colors.subText }]}>
                    Private
                  </Text>
                </View>
              )}
            </View>

            <View style={styles.metaContainer}>
              <View style={styles.metaItem}>
                <Ionicons
                  name="musical-notes-outline"
                  size={14}
                  color={colors.primary}
                />
                <Text style={[styles.metaText, { color: colors.subText }]}>
                  {playlistSongs.length} tracks
                </Text>
              </View>
              <View
                style={[styles.metaDot, { backgroundColor: colors.border }]}
              />
              <View style={styles.metaItem}>
                <Ionicons
                  name="person-outline"
                  size={14}
                  color={colors.primary}
                />
                <Text style={[styles.metaText, { color: colors.subText }]}>
                  {playlist?.user_id === session?.user.id
                    ? "Your collection"
                    : "Curated Playlist"}
                </Text>
              </View>
            </View>

            <View style={styles.actionRow}>
              <TouchableOpacity
                style={[
                  styles.playAllButton,
                  {
                    backgroundColor: colors.primary,
                    shadowColor: colors.primary,
                  },
                ]}
                onPress={() =>
                  playlistSongs.length > 0 && handleSongPress(playlistSongs[0])
                }
                activeOpacity={0.8}
              >
                <Ionicons name="play" size={18} color={colors.text} />
                <Text style={[styles.playAllText, { color: colors.text }]}>
                  PLAY
                </Text>
              </TouchableOpacity>

              <PlaylistOptionsMenu
                playlistId={playlistId}
                userId={playlist?.user_id}
                currentTitle={playlist?.title}
                isPublic={playlist?.is_public}
                songs={playlistSongs}
              />
            </View>
          </BlurView>
        </View>
      </View>
    ),
    [
      playlist,
      playlistSongs,
      session?.user.id,
      router,
      playlistId,
      handleSongPress,
      colors,
    ],
  );

  if (isLoading || isLoadingPlaylist) return <Loading />;
  if (error || playlistError)
    return <Error message={error?.message || playlistError?.message} />;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <FlashList
        data={playlistSongs}
        keyExtractor={keyExtractor}
        renderItem={renderSongs}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.listContent}
        estimatedItemSize={120}
        key={"playlist-songs-list"}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="musical-notes-outline"
              size={64}
              color={colors.border}
            />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              Empty Playlist
            </Text>
            <Text style={[styles.emptySubText, { color: colors.subText }]}>
              Add tracks from your discovery
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    width: "100%",
  },
  thumbnailContainer: {
    width: width,
    height: width * 1.05,
    position: "relative",
  },
  thumbnail: {
    width: "100%",
    height: "100%",
  },
  thumbnailGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
  },
  infoWrapper: {
    marginTop: -width * 0.35,
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  infoContainer: {
    padding: 24,
    borderRadius: 28,
    overflow: "hidden",
    backgroundColor: "rgba(20, 20, 20, 0.65)",
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontFamily: FONTS.title,
    flex: 1,
    marginRight: 12,
    lineHeight: 34,
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  privacyText: {
    fontSize: 10,
    fontFamily: FONTS.semibold,
    marginLeft: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 12,
    fontFamily: FONTS.body,
    marginLeft: 6,
    opacity: 0.8,
  },
  metaDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 10,
    opacity: 0.4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  playAllButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  playAllText: {
    fontSize: 14,
    fontFamily: FONTS.bold,
    marginLeft: 8,
    letterSpacing: 1,
  },
  listContent: {
    paddingBottom: 100,
  },
  emptyContainer: {
    paddingTop: 60,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: FONTS.title,
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    marginTop: 8,
    textAlign: "center",
    opacity: 0.6,
  },
});
