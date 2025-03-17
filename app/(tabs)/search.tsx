import React, { useState } from "react";
import {
  View,
  TextInput,
  StyleSheet,
  FlatList,
  SafeAreaView,
  Text,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import getSongsByTitle from "@/actions/getSongsByTitle";
import getPlaylistsByTitle from "@/actions/getPlaylistsByTitle";
import ListItem from "@/components/ListItem";
import PlaylistItem from "@/components/PlaylistItem";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { CACHED_QUERIES } from "@/constants";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import CustomButton from "@/components/CustomButton";
import { useRouter } from "expo-router";
import { Playlist } from "@/types";
import { Ionicons } from "@expo/vector-icons";

type SearchType = "songs" | "playlists";

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchType, setSearchType] = useState<SearchType>("songs");
  const debouncedQuery = useDebounce(searchQuery, 500);
  const router = useRouter();

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

  const { togglePlayPause } = useAudioPlayer(searchSongs, "search");

  const isLoading =
    searchType === "songs" ? isSongsLoading : isPlaylistsLoading;
  const error = searchType === "songs" ? songsError : playlistsError;

  const handlePlaylistPress = (playlist: Playlist) => {
    router.push(`/playlist/${playlist.id}`);
  };

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  const hasResults =
    searchType === "songs"
      ? searchSongs.length > 0
      : searchPlaylists.length > 0;

  const showEmptyState = debouncedQuery.length > 0 && !hasResults;

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
            <FlatList
              key="songs-list"
              data={searchSongs}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <ListItem
                  song={item}
                  onPress={async (song) => {
                    await togglePlayPause(song);
                  }}
                />
              )}
              contentContainerStyle={styles.listContainer}
              ListEmptyComponent={
                debouncedQuery.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="search" size={64} color="#666" />
                    <Text style={styles.emptyText}>Search for songs</Text>
                  </View>
                ) : null
              }
            />
          ) : (
            <FlatList
              key="playlists-list"
              data={searchPlaylists}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <PlaylistItem playlist={item} onPress={handlePlaylistPress} />
              )}
              contentContainerStyle={[
                styles.listContainer,
                styles.playlistContainer,
              ]}
              numColumns={2}
              ListEmptyComponent={
                debouncedQuery.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Ionicons name="list" size={64} color="#666" />
                    <Text style={styles.emptyText}>Search for playlists</Text>
                  </View>
                ) : null
              }
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
});
