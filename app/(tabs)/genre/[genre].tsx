import React, { useCallback } from "react";
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { FlashList } from "@shopify/flash-list";
import { useQuery } from "@tanstack/react-query";
import { useFocusEffect, useRouter } from "expo-router";
import { ChevronLeft, CloudOff, Music2 } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import getSongsByGenre from "@/actions/song/getSongsByGenre";
import ListItem from "@/components/item/ListItem";
import Loading from "@/components/common/Loading";
import Error from "@/components/common/Error";
import { usePlayControls } from "@/hooks/audio/useAudioPlayer";
import { useLocalSearchParams } from "expo-router";
import { CACHED_QUERIES } from "@/constants";
import { useHeaderStore } from "@/hooks/stores/useHeaderStore";
import Song from "@/types";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { COLORS, FONTS } from "@/constants/theme";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";

const { width } = Dimensions.get("window");

export default function GenreSongsScreen() {
  const router = useRouter();
  const { genre } = useLocalSearchParams<{ genre: string }>();
  const setShowHeader = useHeaderStore((state) => state.setShowHeader);
  const { isOnline } = useNetworkStatus();

  const {
    data: genreSongs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.songsByGenre, genre],
    queryFn: () => getSongsByGenre(genre),
    enabled: !!genre && isOnline,
  });

  useFocusEffect(
    useCallback(() => {
      setShowHeader(false);
      return () => {
        setShowHeader(true);
      };
    }, [setShowHeader]),
  );

  const { togglePlayPause } = usePlayControls(genreSongs, "genre", genre);

  const handleSongPress = useCallback(
    async (song: Song) => {
      await togglePlayPause(song);
    },
    [togglePlayPause],
  );

  const renderItem = useCallback(
    ({ item }: { item: Song }) => (
      <ListItem song={item} onPress={handleSongPress} />
    ),
    [handleSongPress],
  );

  const keyExtractor = useCallback((item: Song) => item.id, []);

  if (!isOnline) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft color={COLORS.text} size={28} strokeWidth={1.5} />
          </TouchableOpacity>
        </View>
        <View style={[styles.container, styles.center]}>
          <CloudOff size={64} color={COLORS.subText} strokeWidth={1} />
          <Text style={styles.emptyText}>You are offline</Text>
          <Text style={styles.emptySubText}>
            Genre search is only available when online
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ChevronLeft color={COLORS.text} size={28} strokeWidth={1.5} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerSubtitle}>EXPLORE GENRE</Text>
            <Animated.Text
              entering={FadeInUp.duration(600)}
              style={styles.title}
            >
              {genre}
            </Animated.Text>
          </View>
          <View style={{ width: 44 }} />
        </View>

        <View style={styles.listWrapper}>
          <FlashList
            data={genreSongs}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            contentContainerStyle={styles.listContainer}
            estimatedItemSize={80}
            ListHeaderComponent={
              <Animated.View
                entering={FadeInDown.delay(200)}
                style={styles.listHeader}
              >
                <View style={styles.countBadge}>
                  <Music2 color={COLORS.primary} size={14} />
                  <Text style={styles.countText}>
                    {genreSongs.length} Curated Tracks
                  </Text>
                </View>
                <View style={styles.divider} />
              </Animated.View>
            }
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitleContainer: {
    alignItems: "center",
    flex: 1,
  },
  headerSubtitle: {
    color: COLORS.primary,
    fontSize: 10,
    fontFamily: FONTS.semibold,
    letterSpacing: 2,
    marginBottom: 4,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  title: {
    color: COLORS.text,
    fontSize: 32,
    fontFamily: FONTS.title,
    textAlign: "center",
  },
  listWrapper: {
    flex: 1,
    marginTop: 20,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  listHeader: {
    marginBottom: 20,
  },
  countBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(212, 175, 55, 0.08)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 16,
  },
  countText: {
    color: COLORS.primary,
    fontSize: 12,
    fontFamily: FONTS.semibold,
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    width: "100%",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100,
  },
  emptyText: {
    color: COLORS.text,
    fontSize: 20,
    fontFamily: FONTS.semibold,
    marginTop: 24,
  },
  emptySubText: {
    color: COLORS.subText,
    fontSize: 14,
    fontFamily: FONTS.body,
    marginTop: 8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
});
