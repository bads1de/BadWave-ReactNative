import React, { useState, useCallback, useMemo, useEffect, memo } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  SafeAreaView,
  Text,
  TouchableOpacity,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/common/useDebounce";
import getSongsByTitle from "@/actions/song/getSongsByTitle";
import getPlaylistsByTitle from "@/actions/playlist/getPlaylistsByTitle";
import ListItem from "@/components/item/ListItem";
import PlaylistItem from "@/components/item/PlaylistItem";
import { useAudioPlayer } from "@/hooks/audio/useAudioPlayer";
import { CACHED_QUERIES } from "@/constants";
import Loading from "@/components/common/Loading";
import Error from "@/components/common/Error";
import { useRouter } from "expo-router";
import { Playlist } from "@/types";
import Song from "@/types";
import {
  Search,
  CircleX,
  CloudOff,
  Library as LibraryIcon,
  Music,
} from "lucide-react-native";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { useSearchHistoryStore } from "@/hooks/stores/useSearchHistoryStore";
import { SearchHistory } from "@/components/search/SearchHistory";
import { FONTS } from "@/constants/theme";

type SearchType = "songs" | "playlists";

function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("songs");
  const debouncedQuery = useDebounce(searchQuery, 500);
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const colors = useThemeStore((state) => state.colors);
  const [isFocused, setIsFocused] = useState(false);

  // 検索履歴
  const { history, addQuery, removeQuery, clearHistory, loadHistory } =
    useSearchHistoryStore();

  // マウント時にMMKVから履歴を復元
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const {
    data: searchSongs = [],
    isLoading: isSongsLoading,
    error: songsError,
    isSuccess: isSongsSuccess,
  } = useQuery({
    queryKey: [CACHED_QUERIES.songs, CACHED_QUERIES.search, debouncedQuery],
    queryFn: () => getSongsByTitle(debouncedQuery),
    enabled: debouncedQuery.length > 0 && searchType === "songs",
  });

  const {
    data: searchPlaylists = [],
    isLoading: isPlaylistsLoading,
    error: playlistsError,
    isSuccess: isPlaylistsSuccess,
  } = useQuery({
    queryKey: [CACHED_QUERIES.playlists, CACHED_QUERIES.search, debouncedQuery],
    queryFn: () => getPlaylistsByTitle(debouncedQuery),
    enabled: debouncedQuery.length > 0 && searchType === "playlists",
  });

  // 検索結果が返ってきた時に履歴に保存
  useEffect(() => {
    if (debouncedQuery.length > 0 && (isSongsSuccess || isPlaylistsSuccess)) {
      addQuery(debouncedQuery);
    }
  }, [debouncedQuery, isSongsSuccess, isPlaylistsSuccess, addQuery]);

  const audioPlayer = useAudioPlayer(searchSongs, "search");

  // 曲の再生/一時停止を切り替えるハンドラをメモ化
  const handleSongPress = useCallback(
    async (song: Song) => {
      await audioPlayer.togglePlayPause(song);
    },
    [audioPlayer],
  );

  // 検索履歴からキーワードを選択した時のハンドラ
  const handleHistorySelect = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const isLoading =
    searchType === "songs" ? isSongsLoading : isPlaylistsLoading;
  const error = searchType === "songs" ? songsError : playlistsError;

  // プレイリストをクリックしたときのハンドラをメモ化
  const handlePlaylistPress = useCallback(
    (playlist: Playlist) => {
      router.push(`/playlist/${playlist.id}`);
    },
    [router],
  );

  // FlashListのrenderItem関数をメモ化
  const renderSongItem = useCallback(
    ({ item }: { item: Song }) => (
      <ListItem song={item} onPress={handleSongPress} />
    ),
    [handleSongPress],
  );

  // プレイリストのrenderItem関数をメモ化
  const renderPlaylistItem = useCallback(
    ({ item }: { item: Playlist }) => (
      <PlaylistItem playlist={item} onPress={handlePlaylistPress} />
    ),
    [handlePlaylistPress],
  );

  // keyExtractor関数をメモ化
  const keyExtractor = useCallback((item: Song | Playlist) => item.id, []);

  // ListEmptyComponentをメモ化
  const songsEmptyComponent = useMemo(() => {
    return debouncedQuery.length === 0 ? (
      <View style={[styles.emptyContainer, { opacity: 0.8 }]}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.card, shadowColor: colors.primary },
          ]}
        >
          <Music size={32} color={colors.primary} />
        </View>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Search for songs
        </Text>
        <Text style={[styles.emptySubText, { color: colors.subText }]}>
          Find your favorite tracks
        </Text>
      </View>
    ) : null;
  }, [debouncedQuery.length, colors]);

  const playlistsEmptyComponent = useMemo(() => {
    return debouncedQuery.length === 0 ? (
      <View style={[styles.emptyContainer, { opacity: 0.8 }]}>
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.card, shadowColor: colors.primary },
          ]}
        >
          <LibraryIcon size={32} color={colors.primary} />
        </View>
        <Text style={[styles.emptyText, { color: colors.text }]}>
          Search for playlists
        </Text>
        <Text style={[styles.emptySubText, { color: colors.subText }]}>
          Discover new collections
        </Text>
      </View>
    ) : null;
  }, [debouncedQuery.length, colors]);

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  const hasResults =
    searchType === "songs"
      ? searchSongs.length > 0
      : searchPlaylists.length > 0;

  const showEmptyState = debouncedQuery.length > 0 && !hasResults;

  if (!isOnline) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Search
          </Text>
        </View>
        <View style={styles.emptyContainer}>
          <CloudOff size={64} color={colors.subText} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            You are offline
          </Text>
          <Text style={[styles.emptySubText, { color: colors.subText }]}>
            Search is only available when online
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text
          style={[
            styles.headerTitle,
            {
              color: colors.text,
            },
          ]}
        >
          Search
        </Text>
      </View>

      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchInputContainer,
            isFocused
              ? [
                  styles.searchInputFocused,
                  { borderColor: colors.primary, shadowColor: colors.primary },
                ]
              : styles.searchInputNormal,
          ]}
        >
          <Search
            size={20}
            color={isFocused ? colors.primary : colors.subText}
            style={styles.searchIcon}
          />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder="Search songs or playlists..."
            placeholderTextColor={colors.subText}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <CircleX
                size={20}
                color={colors.subText}
                style={styles.clearIcon}
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.tabContainer}>
          <TouchableOpacity
            onPress={() => setSearchType("songs")}
            style={[
              styles.tabItem,
              searchType === "songs"
                ? styles.tabItemActive
                : styles.tabItemInactive,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                searchType === "songs"
                  ? styles.tabTextActive
                  : styles.tabTextInactive,
                {
                  color: searchType === "songs" ? colors.text : colors.subText,
                },
              ]}
            >
              Songs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSearchType("playlists")}
            style={[
              styles.tabItem,
              searchType === "playlists"
                ? styles.tabItemActive
                : styles.tabItemInactive,
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                searchType === "playlists"
                  ? styles.tabTextActive
                  : styles.tabTextInactive,
                {
                  color:
                    searchType === "playlists" ? colors.text : colors.subText,
                },
              ]}
            >
              Playlists
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 検索バーが空の時に検索履歴を表示 */}
      {debouncedQuery.length === 0 && history.length > 0 && (
        <View style={styles.historySection}>
          <SearchHistory
            history={history}
            onSelect={handleHistorySelect}
            onRemove={removeQuery}
            onClearAll={clearHistory}
          />
        </View>
      )}

      {showEmptyState ? (
        <View style={styles.emptyContainer}>
          <Search size={64} color={colors.subText} />
          <Text style={[styles.emptyText, { color: colors.text }]}>
            No results found
          </Text>
          <Text style={[styles.emptySubText, { color: colors.subText }]}>
            Try adjusting your search terms
          </Text>
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
              estimatedItemSize={80}
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
              estimatedItemSize={220}
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
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: FONTS.title,
    letterSpacing: 1,
  },
  historySection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 28, // More pill-like
    paddingHorizontal: 20,
    height: 56, // Slightly taller for emphasis
    marginBottom: 24,
    borderWidth: 1,
  },
  searchInputFocused: {
    backgroundColor: "rgba(255,255,255,0.08)",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  searchInputNormal: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderColor: "transparent",
    shadowColor: "transparent",
    shadowOpacity: 0,
  },
  searchIcon: {
    marginRight: 12,
  },
  clearIcon: {
    marginLeft: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    height: "100%",
    fontFamily: FONTS.body,
  },
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "rgba(255,255,255,0.03)",
    padding: 6,
    borderRadius: 24,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  tabItemActive: {
    backgroundColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  tabItemInactive: {
    backgroundColor: "transparent",
  },
  tabText: {
    fontSize: 14,
  },
  tabTextActive: {
    fontFamily: FONTS.bold,
  },
  tabTextInactive: {
    fontFamily: FONTS.semibold,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  playlistContainer: {
    paddingTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 60,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  emptyText: {
    fontSize: 20,
    fontFamily: FONTS.semibold,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 15,
    fontFamily: FONTS.body,
    marginBottom: 8,
  },
});

// コンポーネント全体をメモ化してエクスポート
export default memo(SearchScreen);
