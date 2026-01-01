import React, { useState, useCallback, useMemo, memo } from "react";
import { View, TextInput, StyleSheet, SafeAreaView, Text } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import getSongsByTitle from "@/actions/getSongsByTitle";
import getPlaylistsByTitle from "@/actions/getPlaylistsByTitle";
import ListItem from "@/components/item/ListItem";
import PlaylistItem from "@/components/item/PlaylistItem";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { CACHED_QUERIES } from "@/constants";
import Loading from "@/components/common/Loading";
import Error from "@/components/common/Error";
import CustomButton from "@/components/common/CustomButton";
import { useRouter } from "expo-router";
import { Playlist } from "@/types";
import Song from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

type SearchType = "songs" | "playlists";

function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("songs");
  const debouncedQuery = useDebounce(searchQuery, 500);
  const router = useRouter();
  const { isOnline } = useNetworkStatus();

  const {
    data: searchSongs = [],
    isLoading: isSongsLoading,
    error: songsError,
  } = useQuery({
    queryKey: [CACHED_QUERIES.songs, CACHED_QUERIES.search, debouncedQuery],
    queryFn: () => getSongsByTitle(debouncedQuery),
    enabled: debouncedQuery.length > 0 && searchType === "songs",
  });

  const {
    data: searchPlaylists = [],
    isLoading: isPlaylistsLoading,
    error: playlistsError,
  } = useQuery({
    queryKey: [CACHED_QUERIES.playlists, CACHED_QUERIES.search, debouncedQuery],
    queryFn: () => getPlaylistsByTitle(debouncedQuery),
    enabled: debouncedQuery.length > 0 && searchType === "playlists",
  });

  const audioPlayer = useAudioPlayer(searchSongs, "search");

  // 曲の再生/一時停止を切り替えるハンドラをメモ化
  const togglePlayPause = useCallback(
    async (song: Song) => {
      await audioPlayer.togglePlayPause(song);
    },
    [audioPlayer]
  );

  const isLoading =
    searchType === "songs" ? isSongsLoading : isPlaylistsLoading;
  const error = searchType === "songs" ? songsError : playlistsError;

  // プレイリストをクリックしたときのハンドラをメモ化
  const handlePlaylistPress = useCallback(
    (playlist: Playlist) => {
      router.push(`/playlist/${playlist.id}`);
    },
    [router]
  );

  // FlatListのrenderItem関数をメモ化
  const renderSongItem = useCallback(
    ({ item }: { item: Song }) => (
      <ListItem song={item} onPress={togglePlayPause} />
    ),
    [togglePlayPause]
  );

  // プレイリストのrenderItem関数をメモ化
  const renderPlaylistItem = useCallback(
    ({ item }: { item: Playlist }) => (
      <PlaylistItem playlist={item} onPress={handlePlaylistPress} />
    ),
    [handlePlaylistPress]
  );

  // keyExtractor関数をメモ化
  const keyExtractor = useCallback((item: Song | Playlist) => item.id, []);

  // ListEmptyComponentをメモ化
  const songsEmptyComponent = useMemo(() => {
    return debouncedQuery.length === 0 ? (
      <View style={styles.emptyContainer}>
        <Ionicons name="search" size={64} color="#666" />
        <Text style={styles.emptyText}>Search for songs</Text>
      </View>
    ) : null;
  }, [debouncedQuery.length]);

  const playlistsEmptyComponent = useMemo(() => {
    return debouncedQuery.length === 0 ? (
      <View style={styles.emptyContainer}>
        <Ionicons name="list" size={64} color="#666" />
        <Text style={styles.emptyText}>Search for playlists</Text>
      </View>
    ) : null;
  }, [debouncedQuery.length]);

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  const hasResults =
    searchType === "songs"
      ? searchSongs.length > 0
      : searchPlaylists.length > 0;

  const showEmptyState = debouncedQuery.length > 0 && !hasResults;

  if (!isOnline) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Search</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Ionicons name="cloud-offline" size={64} color="#666" />
          <Text style={styles.emptyText}>You are offline</Text>
          <Text style={styles.emptySubText}>
            Search is only available when online
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Search</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color="#666"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by song or playlist name..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Ionicons
              name="close-circle"
              size={20}
              color="#666"
              style={styles.clearIcon}
              onPress={() => setSearchQuery("")}
            />
          )}
        </View>

        <View style={styles.buttonContainer}>
          <CustomButton
            label="Songs"
            isActive={searchType === "songs"}
            activeStyle={styles.activeButton}
            inactiveStyle={styles.inactiveButton}
            activeTextStyle={styles.activeButtonText}
            inactiveTextStyle={styles.inactiveButtonText}
            onPress={() => setSearchType("songs")}
          />
          <CustomButton
            label="Playlists"
            isActive={searchType === "playlists"}
            activeStyle={styles.activeButton}
            inactiveStyle={styles.inactiveButton}
            activeTextStyle={styles.activeButtonText}
            inactiveTextStyle={styles.inactiveButtonText}
            onPress={() => setSearchType("playlists")}
          />
        </View>
      </View>

      {showEmptyState ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={64} color="#666" />
          <Text style={styles.emptyText}>No results found</Text>
        </View>
      ) : (
        <>
          {searchType === "songs" ? (
            <FlashList
              key="songs-list"
              data={searchSongs}
              keyExtractor={keyExtractor}
              renderItem={renderSongItem}
              contentContainerStyle={styles.listContainer}
              estimatedItemSize={100}
              ListEmptyComponent={songsEmptyComponent}
            />
          ) : (
            <FlashList
              key="playlists-list"
              data={searchPlaylists}
              keyExtractor={keyExtractor}
              renderItem={renderPlaylistItem}
              contentContainerStyle={{
                ...styles.listContainer,
                ...styles.playlistContainer,
              }}
              numColumns={2}
              estimatedItemSize={200}
              ListEmptyComponent={playlistsEmptyComponent}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  headerTitle: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  clearIcon: {
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    padding: 12,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 12,
  },
  activeButton: {
    backgroundColor: "#4c1d95",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  inactiveButton: {
    backgroundColor: "#222",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  activeButtonText: {
    color: "#fff",
    fontWeight: "700",
  },
  inactiveButtonText: {
    color: "#999",
    fontWeight: "600",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 96,
  },
  playlistContainer: {
    paddingTop: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    marginTop: 16,
  },
  emptySubText: {
    color: "#444",
    fontSize: 14,
    marginTop: 8,
  },
});

// コンポーネント全体をメモ化してエクスポート
export default memo(SearchScreen);
