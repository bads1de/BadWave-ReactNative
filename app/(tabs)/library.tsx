import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
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
import { FONTS, COLORS } from "@/constants/theme";
import { BlurView } from "expo-blur";
import { Heart, ListMusic, Plus } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Animated, { FadeIn, FadeInDown, FadeOut } from "react-native-reanimated";

const { width } = Dimensions.get("window");

type LibraryType = "liked" | "playlists";

export default function LibraryScreen() {
  const [type, setType] = useState<LibraryType>("liked");
  const { session } = useAuth();
  const setShowAuthModal = useAuthStore((state) => state.setShowAuthModal);
  const router = useRouter();
  const userId = session?.user?.id;
  const colors = useThemeStore((state) => state.colors);

  const {
    likedSongs = [],
    isLoading: isLikedLoading,
    error: likedError,
  } = useGetLikedSongs(userId);

  const {
    playlists = [],
    isLoading: isPlaylistsLoading,
    error: playlistsError,
  } = useGetPlaylists(userId);

  const currentSongs = useMemo(() => {
    if (type === "liked") return likedSongs;
    return [];
  }, [type, likedSongs]);

  const { togglePlayPause } = usePlayControls(
    currentSongs,
    type === "liked" ? "liked" : "playlist",
  );

  const handleSongPress = useCallback(
    async (songId: string) => {
      const song = likedSongs.find((s) => s.id === songId);
      if (song) {
        await togglePlayPause(song);
      }
    },
    [likedSongs, togglePlayPause],
  );

  const handlePlaylistPress = useCallback(
    (playlist: Playlist) => {
      router.push({
        pathname: "/playlist/[playlistId]",
        params: { playlistId: playlist.id },
      });
    },
    [router],
  );

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
    <View style={[styles.container, { backgroundColor: COLORS.background }]}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header Section */}
        <View style={styles.header}>
          <View>
            <Text style={styles.subtitle}>YOUR CURATED</Text>
            <Text style={styles.title}>Library</Text>
          </View>

          {type === "playlists" && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
            >
              <CreatePlaylist>
                <View style={styles.premiumPillButton}>
                  <Plus color={COLORS.background} size={14} strokeWidth={3} />
                  <Text style={styles.premiumPillText}>NEW</Text>
                </View>
              </CreatePlaylist>
            </Animated.View>
          )}
        </View>

        {!session ? (
          <Animated.View
            entering={FadeIn.duration(800)}
            style={styles.loginContainer}
          >
            <View style={styles.loginGlass}>
              <Text style={styles.loginMessage}>
                Unlock your musical sanctuary. Sign in to access your personal
                collection.
              </Text>
              <CustomButton
                label="Sign In to Badwave"
                isActive
                onPress={() => setShowAuthModal(true)}
                activeStyle={styles.loginButton}
                activeTextStyle={styles.loginButtonText}
              />
            </View>
          </Animated.View>
        ) : (
          <>
            {/* Boutique Tab Switcher */}
            <View style={styles.tabWrapper}>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  onPress={() => setType("liked")}
                  style={[
                    styles.tabItem,
                    type === "liked" && styles.tabItemActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <Heart
                    size={16}
                    color={
                      type === "liked" ? COLORS.background : COLORS.subText
                    }
                    fill={type === "liked" ? COLORS.background : "transparent"}
                  />
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          type === "liked" ? COLORS.background : COLORS.subText,
                      },
                    ]}
                  >
                    Favorites
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setType("playlists")}
                  style={[
                    styles.tabItem,
                    type === "playlists" && styles.tabItemActive,
                  ]}
                  activeOpacity={0.8}
                >
                  <ListMusic
                    size={16}
                    color={
                      type === "playlists" ? COLORS.background : COLORS.subText
                    }
                  />
                  <Text
                    style={[
                      styles.tabText,
                      {
                        color:
                          type === "playlists"
                            ? COLORS.background
                            : COLORS.subText,
                      },
                    ]}
                  >
                    Playlists
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.contentArea}>
              {type === "liked" ? (
                likedSongs && likedSongs.length > 0 ? (
                  <>
                    <Animated.View
                      entering={FadeInDown}
                      style={styles.utilityRow}
                    >
                      <View style={styles.countBadge}>
                        <Text style={styles.countText}>
                          {likedSongs.length} Tracks
                        </Text>
                      </View>
                      <BulkDownloadButton songs={likedSongs} size="small" />
                    </Animated.View>
                    <FlashList
                      key={"liked"}
                      data={likedSongs}
                      renderItem={renderLikedSongs}
                      keyExtractor={keyExtractor}
                      numColumns={2}
                      contentContainerStyle={styles.listContainer}
                      estimatedItemSize={280} // Actual mapped item height is ~276px
                      showsVerticalScrollIndicator={false}
                    />
                  </>
                ) : (
                  <Animated.View
                    entering={FadeIn.delay(200)}
                    style={styles.emptyContainer}
                  >
                    <View style={styles.emptyGlass}>
                      <Heart
                        size={48}
                        color={COLORS.primary}
                        strokeWidth={1}
                        opacity={0.4}
                      />
                      <Text style={styles.emptyTitle}>Pure Silence</Text>
                      <Text style={styles.emptySubText}>
                        Your heart hasn't found its rhythm yet. Start liking
                        songs to curate your sanctuary.
                      </Text>
                    </View>
                  </Animated.View>
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
                  showsVerticalScrollIndicator={false}
                />
              ) : (
                <Animated.View
                  entering={FadeIn.delay(200)}
                  style={styles.emptyContainer}
                >
                  <View style={styles.emptyGlass}>
                    <ListMusic
                      size={48}
                      color={COLORS.primary}
                      strokeWidth={1}
                      opacity={0.4}
                    />
                    <Text style={styles.emptyTitle}>Blank Canvas</Text>
                    <Text style={styles.emptySubText}>
                      Design your own musical journey. Create your first
                      playlist to begin.
                    </Text>
                  </View>
                </Animated.View>
              )}
            </View>
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  premiumPillButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    marginBottom: 4,
  },
  premiumPillText: {
    color: COLORS.background,
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 1,
  },
  subtitle: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONTS.semibold,
    letterSpacing: 3,
    marginBottom: 4,
  },
  title: {
    fontSize: 42,
    fontFamily: FONTS.title,
    color: COLORS.text,
    lineHeight: 48,
  },
  loginContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  loginGlass: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderRadius: 32,
    padding: 32,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    alignItems: "center",
  },
  loginMessage: {
    fontSize: 18,
    color: COLORS.subText,
    textAlign: "center",
    marginBottom: 32,
    fontFamily: FONTS.body,
    lineHeight: 26,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    width: "100%",
  },
  loginButtonText: {
    color: COLORS.background,
    fontSize: 16,
    fontFamily: FONTS.bold,
  },
  tabWrapper: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 30,
    padding: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  tabItemActive: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  tabText: {
    fontSize: 14,
    fontFamily: FONTS.semibold,
    letterSpacing: 0.5,
  },
  contentArea: {
    flex: 1,
  },
  playlistActionRow: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  utilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  countBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    color: COLORS.subText,
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 120,
  },
  emptyContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
  },
  emptyGlass: {
    backgroundColor: "rgba(255, 255, 255, 0.02)",
    borderRadius: 32,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.05)",
    borderStyle: "dashed",
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: FONTS.title,
    color: COLORS.text,
    marginTop: 20,
    marginBottom: 12,
  },
  emptySubText: {
    fontSize: 14,
    color: COLORS.subText,
    textAlign: "center",
    fontFamily: FONTS.body,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
});
