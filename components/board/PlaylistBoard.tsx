import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import { FlashList } from "@shopify/flash-list";
import { Playlist } from "@/types";
import { CACHED_QUERIES } from "@/constants";
import getPublicPlaylists from "@/actions/playlist/getPublicPlaylists";
import { useQuery } from "@tanstack/react-query";
import { memo, useCallback } from "react";

import { useThemeStore } from "@/hooks/stores/useThemeStore";
import Loading from "@/components/common/Loading";

const { width } = Dimensions.get("window");
const ITEM_WIDTH = 160;

interface PlaylistCardProps {
  playlist: Playlist;
  onPress: (playlist: Playlist) => void;
  colors: any;
}

const PlaylistCard = memo(({ playlist, onPress, colors }: PlaylistCardProps) => {
  return (
    <View style={styles.animatedCardItem}>
      <TouchableOpacity
        onPress={() => onPress(playlist)}
        style={[
          styles.cardTouchable,
          {
            backgroundColor: colors.card + "66", // 40% opacity
            borderColor: colors.glow + "0D", // 5% opacity
          },
        ]}
      >
        {/* アートワーク */}
        <View style={styles.imageWrapper}>
          <Image
            source={{
              uri: playlist.image_path,
            }}
            style={styles.image}
            contentFit="cover"
            cachePolicy="disk"
          />

          {/* オーバーレイグラデーション */}
          <View style={styles.overlayGradient} />
        </View>

        {/* プレイリスト情報 */}
        <View style={styles.infoWrapper}>
          <View style={styles.infoContent}>
            <Text style={styles.playlistTitle} numberOfLines={1}>
              {playlist.title}
            </Text>

            <Text style={styles.playlistAuthor} numberOfLines={1}>
              {playlist.user_name || "Anonymous"}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
});

PlaylistCard.displayName = "PlaylistCard";

function PlaylistBoard() {
  const colors = useThemeStore((state) => state.colors);
  const {
    data: playlists = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.getPublicPlaylists],
    queryFn: () => getPublicPlaylists(10),
    staleTime: 1000 * 60 * 5, // 5分
    refetchOnWindowFocus: false,
  });

  const router = useRouter();

  const handlePlaylistPress = useCallback(
    (playlist: Playlist) => {
      router.push({
        pathname: "/(tabs)/playlist/[playlistId]" as const,
        params: {
          playlistId: playlist.id,
          title: playlist.title,
        },
      });
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: Playlist }) => (
      <PlaylistCard playlist={item} onPress={handlePlaylistPress} colors={colors} />
    ),
    [handlePlaylistPress, colors]
  );

  const keyExtractor = useCallback((item: Playlist) => item.id, []);

  if (isLoading)
    return (
      <View style={styles.container}>
        <Loading
          variant="grid"
          gridProps={{ count: 2, columns: 2, paddingHorizontal: 16 }}
        />
      </View>
    );

  if (error) return null;

  return (
    <View style={styles.container}>
      <FlashList
        data={playlists}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        estimatedItemSize={ITEM_WIDTH + 16} // Item width + gap
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    height: ITEM_WIDTH, // Fixed height for horizontal FlashList
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  animatedCardItem: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    marginRight: 16, // Instead of gap in ScrollView
  },
  cardTouchable: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
  },
  imageWrapper: {
    flex: 1,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlayGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  infoWrapper: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  infoContent: {
    gap: 4,
  },
  playlistTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "white",
  },
  playlistAuthor: {
    fontSize: 12,
    color: "#D4D4D4",
  },
});

// メモ化してエクスポート
export default memo(PlaylistBoard);
