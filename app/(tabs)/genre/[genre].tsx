import React, { useCallback } from "react";
import { View, StyleSheet, Text, TouchableOpacity } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import getSongsByGenre from "@/actions/getSongsByGenre";
import ListItem from "@/components/item/ListItem";
import Loading from "@/components/common/Loading";
import Error from "@/components/common/Error";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useLocalSearchParams } from "expo-router";
import { CACHED_QUERIES } from "@/constants";
import { useHeaderStore } from "@/hooks/useHeaderStore";
import Song from "@/types";

export default function GenreSongsScreen() {
  const router = useRouter();
  const { genre } = useLocalSearchParams<{ genre: string }>();
  const setShowHeader = useHeaderStore((state) => state.setShowHeader);
  const {
    data: genreSongs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.songsByGenre, genre],
    queryFn: () => getSongsByGenre(genre),
    enabled: !!genre,
  });

  useFocusEffect(
    useCallback(() => {
      setShowHeader(false);
      return () => {
        setShowHeader(true);
      };
    }, [setShowHeader])
  );

  const { togglePlayPause } = useAudioPlayer(genreSongs, "genre", genre);

  // renderItem関数をメモ化
  const renderItem = useCallback(
    ({ item }: { item: Song }) => (
      <ListItem song={item} onPress={async () => await togglePlayPause(item)} />
    ),
    [togglePlayPause]
  );

  // keyExtractor関数をメモ化
  const keyExtractor = useCallback((item: Song) => item.id, []);

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>{genre}</Text>
        </View>
        <FlashList
          data={genreSongs}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 96,
  },
});
