import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Heart, ListMusic, Plus } from "lucide-react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { TabSwitcher, TabOption } from "@/components/common/TabSwitcher";
import Loading from "@/components/common/Loading";
import Error from "@/components/common/Error";
import CreatePlaylist from "@/components/playlist/CreatePlaylist";
import { LibraryAuthPrompt } from "@/components/library/LibraryAuthPrompt";
import { LibraryLikedSection } from "@/components/library/LibraryLikedSection";
import { LibraryPlaylistsSection } from "@/components/library/LibraryPlaylistsSection";
import { ListItemOptionsSheet } from "@/components/item/ListItemOptionsMenu";
import { useGetLikedSongs } from "@/hooks/data/useGetLikedSongs";
import { useGetPlaylists } from "@/hooks/data/useGetPlaylists";
import { useSongOptionsMenu } from "@/hooks/common/useSongOptionsMenu";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { useAuth } from "@/providers/AuthProvider";
import { useAuthStore } from "@/hooks/stores/useAuthStore";
import { FONTS, COLORS } from "@/constants/theme";
import { Playlist } from "@/types";

type LibraryType = "liked" | "playlists";

const TAB_OPTIONS: TabOption<LibraryType>[] = [
  { label: "Favorites", value: "liked", icon: Heart },
  { label: "Playlists", value: "playlists", icon: ListMusic },
];

export default function LibraryScreen() {
  const [type, setType] = useState<LibraryType>("liked");
  const { session } = useAuth();
  const setShowAuthModal = useAuthStore((state) => state.setShowAuthModal);
  const router = useRouter();
  const userId = session?.user?.id;
  const colors = useThemeStore((state) => state.colors);
  const { isOnline } = useNetworkStatus();
  const {
    selectedSong,
    isSongOptionsVisible,
    openSongOptions,
    closeSongOptions,
  } = useSongOptionsMenu();

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

  const handleTypeChange = useCallback((val: string) => {
    setType(val as LibraryType);
  }, []);

  const handlePlaylistPress = useCallback(
    (playlist: Playlist) => {
      router.push({
        pathname: "/playlist/[playlistId]",
        params: { playlistId: playlist.id },
      });
    },
    [router],
  );

  if (isLikedLoading || isPlaylistsLoading) {
    return (
      <Loading
        variant="grid"
        gridProps={{ count: 6, showHeader: true, paddingHorizontal: 12 }}
      />
    );
  }

  if (likedError || playlistsError) {
    return (
      <Error
        message={
          likedError?.message || playlistsError?.message || "An error occurred"
        }
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.subtitle, { color: colors.primary }]}>
              YOUR CURATED
            </Text>
            <Text style={[styles.title, { color: colors.text }]}>Library</Text>
          </View>

          {type === "playlists" && (
            <Animated.View
              entering={FadeIn.duration(300)}
              exiting={FadeOut.duration(200)}
            >
              <CreatePlaylist>
                <View
                  style={[
                    styles.premiumPillButton,
                    {
                      backgroundColor: colors.primary,
                      shadowColor: colors.primary,
                    },
                  ]}
                >
                  <Plus color={colors.background} size={14} strokeWidth={3} />
                  <Text
                    style={[
                      styles.premiumPillText,
                      { color: colors.background },
                    ]}
                  >
                    NEW
                  </Text>
                </View>
              </CreatePlaylist>
            </Animated.View>
          )}
        </View>

        {!session ? (
          <LibraryAuthPrompt onSignIn={() => setShowAuthModal(true)} />
        ) : (
          <>
            <View style={styles.tabWrapper}>
              <TabSwitcher
                options={TAB_OPTIONS}
                value={type}
                onValueChange={handleTypeChange}
              />
            </View>

            <View style={styles.contentArea}>
              {type === "liked" ? (
                <LibraryLikedSection
                  songs={likedSongs}
                  isOnline={isOnline}
                  onOpenSongOptions={openSongOptions}
                />
              ) : (
                <LibraryPlaylistsSection
                  playlists={playlists}
                  onPlaylistPress={handlePlaylistPress}
                />
              )}
            </View>
          </>
        )}
      </SafeAreaView>

      <ListItemOptionsSheet
        song={selectedSong}
        visible={isSongOptionsVisible}
        onClose={closeSongOptions}
      />
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
  tabWrapper: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  contentArea: {
    flex: 1,
  },
});

