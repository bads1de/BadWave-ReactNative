import React, { useState } from "react";
import { View, TextInput, StyleSheet, FlatList } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import getSongsByTitle from "@/actions/getSongsByTitle";
import ListItem from "@/components/ListItem";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { CACHED_QUERIES } from "@/constants";
import Loading from "@/components/Loading";
import Error from "@/components/Error";

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedQuery = useDebounce(searchQuery, 500);

  const {
    data: songs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.songs, CACHED_QUERIES.search, debouncedQuery],
    queryFn: () => getSongsByTitle(debouncedQuery),
    enabled: debouncedQuery.length > 0,
  });

  const { togglePlayPause } = useAudioPlayer(songs);

  if (error) {
    return <Error message={error.message} />;
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search..."
        placeholderTextColor="#666"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={songs}
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
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  searchInput: {
    backgroundColor: "#111",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginHorizontal: 16,
    marginVertical: 16,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 16,
  },
});
