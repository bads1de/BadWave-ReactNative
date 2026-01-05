/**
 * @file library.tsx
 * @description ユーザーのライブラリ画面コンポーネントです。
 *
 * この画面では、以下のコンテンツを切り替えて表示します。
 * - 「いいね」した曲のリスト
 * - 作成したプレイリストのリスト
 *
 * 認証状態に応じて、ログインを促すメッセージを表示したり、
 * プレイリストの作成機能を提供します。
 */
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { FlashList } from "@shopify/flash-list";
import React, { useState, useCallback, useMemo } from "react";
import Loading from "@/components/common/Loading";
import Error from "@/components/common/Error";
import CustomButton from "@/components/common/CustomButton";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
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
import { BulkDownloadButton } from "@/components/BulkDownloadButton";
import { useThemeStore } from "@/hooks/stores/useThemeStore";

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

  const { togglePlayPause } = useAudioPlayer(
    currentSongs,
    type === "liked" ? "liked" : "playlist"
  );

  // 曲をクリックしたときのハンドラをメモ化
  const handleSongPress = useCallback(
    async (songId: string) => {
      const song = likedSongs.find((s) => s.id === songId);
      if (song) {
        await togglePlayPause(song);
      }
    },
    [likedSongs, togglePlayPause]
  );

  // プレイリストをクリックしたときのハンドラをメモ化
  const handlePlaylistPress = useCallback(
    (playlist: Playlist) => {
      router.push({
        pathname: "/playlist/[playlistId]",
        params: { playlistId: playlist.id },
      });
    },
    [router]
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
    [handleSongPress]
  );

  // プレイリストのrenderItem関数をメモ化
  const renderPlaylistItem = useCallback(
    ({ item }: { item: Playlist }) => (
      <PlaylistItem playlist={item} onPress={handlePlaylistPress} />
    ),
    [handlePlaylistPress]
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
              textShadowColor: colors.glow,
              textShadowRadius: 10,
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
          <View style={styles.tabContainer}>
            <TouchableOpacity
              onPress={() => setType("liked")}
              style={[
                styles.tabItem,
                {
                  backgroundColor:
                    type === "liked" ? colors.primary + "20" : colors.card,
                  borderColor:
                    type === "liked" ? colors.primary : "transparent",
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: type === "liked" ? colors.primary : colors.subText },
                ]}
              >
                Liked Songs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setType("playlists")}
              style={[
                styles.tabItem,
                {
                  backgroundColor:
                    type === "playlists" ? colors.primary + "20" : colors.card,
                  borderColor:
                    type === "playlists" ? colors.primary : "transparent",
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.tabText,
                  {
                    color:
                      type === "playlists" ? colors.primary : colors.subText,
                  },
                ]}
              >
                Playlists
              </Text>
            </TouchableOpacity>
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
                  keyExtractor={(item) => item.id}
                  numColumns={2}
                  contentContainerStyle={styles.listContainer}
                  estimatedItemSize={236}
                />
              </>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, { color: colors.subText }]}>
                  You haven't liked any songs yet.
                </Text>
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
              estimatedItemSize={210}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={[styles.emptyText, { color: colors.subText }]}>
                No playlists created yet.
              </Text>
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
    paddingTop: 16,
  },
  header: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "800",
    letterSpacing: 0.5,
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
    opacity: 0.8,
    lineHeight: 26,
  },
  loginButton: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 30,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "700",
  },
  tabContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabText: {
    fontSize: 15,
    fontWeight: "600",
  },
  createPlaylistContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  listContainer: {
    paddingHorizontal: 8,
    paddingBottom: 100,
  },
  bulkDownloadContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
  },
});
