import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FlashList } from "@shopify/flash-list";
import React, { useState, useCallback, useMemo } from "react";
import Loading from "@/components/common/Loading";
import Error from "@/components/common/Error";
import CustomButton from "@/components/common/CustomButton";
import { usePlayControls } from "@/hooks/audio/useAudioPlayer";
import SongItem from "@/components/item/SongItem";
import Song from "@/types";
import PlaylistItem from "@/components/item/PlaylistItem";
import { useRouter } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { useAuthStore } from "@/hooks/stores/useAuthStore";
import CreatePlaylist from "@/components/playlist/CreatePlaylist";
import { Playlist } from "@/types";
import { useGetLikedSongs } from "@/hooks/data/useGetLikedSongs";
import { useGetPlaylists } from "@/hooks/data/useGetPlaylists";
import { BulkDownloadButton } from "@/components/download/BulkDownloadButton";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";
import { BlurView } from "expo-blur";
import { Heart, ListMusic } from "lucide-react-native";

type LibraryType = "liked" | "playlists";

export default function LibraryScreen() {
  const [type, setType] = useState<LibraryType>("liked");
  const { session } = useAuth();
  const setShowAuthModal = useAuthStore((state) => state.setShowAuthModal);
  const router = useRouter();
  const userId = session?.user?.id;
  const { colors } = useThemeStore();

  // SQLite から取得（Local-First）
  const {
    likedSongs = [],
    isLoading: isLikedLoading,
    error: likedError,
  } = useGetLikedSongs(userId);

  // SQLite から取得（Local-First）
  const {
    playlists = [],
    isLoading: isPlaylistsLoading,
    error: playlistsError,
  } = useGetPlaylists(userId);

  // コンテキストに応じて曲リストを切り替え
  const currentSongs = useMemo(() => {
    if (type === "liked") return likedSongs;
    return [];
  }, [type, likedSongs]);

  const { togglePlayPause } = usePlayControls(
    currentSongs,
    type === "liked" ? "liked" : "playlist",
  );

  // 曲をクリックしたときのハンドラをメモ化
  const handleSongPress = useCallback(
    async (songId: string) => {
      const song = likedSongs.find((s) => s.id === songId);
      if (song) {
        await togglePlayPause(song);
      }
    },
    [likedSongs, togglePlayPause],
  );

  // プレイリストをクリックしたときのハンドラをメモ化
  const handlePlaylistPress = useCallback(
    (playlist: Playlist) => {
      router.push({
        pathname: "/playlist/[playlistId]",
        params: { playlistId: playlist.id },
      });
    },
    [router],
  );

  // keyExtractor関数をメモ化
  const keyExtractor = useCallback((item: Song | Playlist) => item.id, []);

  const renderLikedSongs = useCallback(
    ({ item }: { item: Song }) => {
      return (
        <SongItem
          key={item.id}
          song={item}
          onClick={handleSongPress}
          dynamicSize={true}
        />
      );
    },
    [handleSongPress],
  );

  // プレイリストのrenderItem関数をメモ化
  const renderPlaylistItem = useCallback(
    ({ item }: { item: Playlist }) => (
      <PlaylistItem playlist={item} onPress={handlePlaylistPress} />
    ),
    [handlePlaylistPress],
  );

  if (isLikedLoading || isPlaylistsLoading) return <Loading />;
  if (likedError || playlistsError)
    return (
      <Error
        message={
          likedError?.message || playlistsError?.message || "An error occurred"
        }
      />
    );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text
          style={[
            styles.title,
            {
              color: colors.text,
            },
          ]}
        >
          Library
        </Text>
      </View>

      {!session ? (
        <View style={styles.loginContainer}>
          <Text style={[styles.loginMessage, { color: colors.subText }]}>
            Sign in to access your liked songs and playlists across all your
            devices.
          </Text>
          <CustomButton
            label="Sign In"
            isActive
            onPress={() => setShowAuthModal(true)}
            activeStyle={[
              styles.loginButton,
              {
                backgroundColor: colors.primary,
                shadowColor: colors.primary,
              },
            ]}
            inactiveStyle={{}}
            activeTextStyle={styles.loginButtonText}
            inactiveTextStyle={{}}
          />
        </View>
      ) : (
        <>
          <View style={styles.tabContainerWrapper}>
            <BlurView intensity={20} tint="dark" style={styles.tabContainer}>
              <TouchableOpacity
                onPress={() => setType("liked")}
                style={[
                  styles.tabItem,
                  type === "liked" && {
                    backgroundColor: colors.primary + "4D", // 30% opacity
                  },
                ]}
                activeOpacity={0.7}
              >
                <Heart
                  size={18}
                  color={type === "liked" ? "#FFFFFF" : colors.subText}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: type === "liked" ? "#FFFFFF" : colors.subText,
                    },
                  ]}
                >
                  Liked
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setType("playlists")}
                style={[
                  styles.tabItem,
                  type === "playlists" && {
                    backgroundColor: colors.primary + "4D", // 30% opacity
                  },
                ]}
                activeOpacity={0.7}
              >
                <ListMusic
                  size={18}
                  color={type === "playlists" ? "#FFFFFF" : colors.subText}
                />
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: type === "playlists" ? "#FFFFFF" : colors.subText,
                    },
                  ]}
                >
                  Playlists
                </Text>
              </TouchableOpacity>
            </BlurView>
          </View>

          {type === "playlists" && (
            <View style={styles.createPlaylistContainer}>
              <CreatePlaylist />
            </View>
          )}

          {type === "liked" ? (
            likedSongs && likedSongs.length > 0 ? (
              <>
                <View style={styles.bulkDownloadContainer}>
                  <BulkDownloadButton songs={likedSongs} size="small" />
                </View>
                <FlashList
                  key={"liked"}
                  data={likedSongs}
                  renderItem={renderLikedSongs}
                  keyExtractor={keyExtractor}
                  numColumns={2}
                  contentContainerStyle={styles.listContainer}
                  estimatedItemSize={250}
                />
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <BlurView intensity={15} tint="dark" style={styles.emptyGlass}>
                  <Heart
                    size={48}
                    color={colors.subText}
                    strokeWidth={1.5}
                    opacity={0.6}
                  />
                  <Text style={[styles.emptyText, { color: colors.subText }]}>
                    No liked songs
                  </Text>
                  <Text
                    style={[styles.emptySubText, { color: colors.subText }]}
                  >
                    Start liking songs to see them here.
                  </Text>
                </BlurView>
              </View>
            )
          ) : playlists && playlists.length > 0 ? (
            <FlashList
              key={"playlists"}
              data={playlists}
              renderItem={renderPlaylistItem}
              numColumns={2}
              keyExtractor={keyExtractor}
              contentContainerStyle={styles.listContainer}
              estimatedItemSize={220}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <BlurView intensity={15} tint="dark" style={styles.emptyGlass}>
                <ListMusic
                  size={48}
                  color={colors.subText}
                  strokeWidth={1.5}
                  opacity={0.6}
                />
                <Text style={[styles.emptyText, { color: colors.subText }]}>
                  No playlists
                </Text>
                <Text style={[styles.emptySubText, { color: colors.subText }]}>
                  Create a playlist to organize your music.
                </Text>
              </BlurView>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 12,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  title: {
    fontSize: 34,
    fontFamily: FONTS.title,
    letterSpacing: 1,
  },
  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  loginMessage: {
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
    fontFamily: FONTS.body,
    lineHeight: 28,
  },
  loginButton: {
    paddingVertical: 14,
    paddingHorizontal: 44,
    borderRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  loginButtonText: {
    fontSize: 16,
    fontFamily: FONTS.semibold,
  },
  tabContainerWrapper: {
    paddingHorizontal: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  tabContainer: {
    flexDirection: "row",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    backgroundColor: "rgba(20, 20, 20, 0.4)",
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  tabItem: {
    flex: 1,
    paddingVertical: 14,
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
  },
  tabText: {
    fontSize: 15,
    fontFamily: FONTS.semibold,
  },
  createPlaylistContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingBottom: 120,
  },
  bulkDownloadContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 40,
  },
  emptyGlass: {
    padding: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: "rgba(20, 20, 20, 0.4)",
    borderColor: "rgba(255, 255, 255, 0.12)",
  },
  emptyText: {
    fontSize: 18,
    fontFamily: FONTS.title,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    textAlign: "center",
    opacity: 0.6,
  },
});
