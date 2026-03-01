import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Playlist } from "@/types";
import { CACHED_QUERIES } from "@/constants";
import getPublicPlaylists from "@/actions/playlist/getPublicPlaylists";
import { useQuery } from "@tanstack/react-query";
import { memo, useCallback } from "react";

import { useThemeStore } from "@/hooks/stores/useThemeStore";

function PlaylistBoard() {
  const colors = useThemeStore((state) => state.colors);
  const { data: playlists = [] } = useQuery({
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

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {playlists.map((playlist, i) => (
          <Animated.View
            key={playlist.id}
            entering={FadeInDown.delay(i * 100)}
            style={styles.animatedCardItem}
          >
            <TouchableOpacity
              onPress={() => handlePlaylistPress(playlist)}
              style={[
                styles.cardTouchable,
                {
                  backgroundColor: colors.card + "66", // 40% opacity (元の 23,23,23, 0.4 に相当)
                  borderColor: colors.glow + "0D", // 5% opacity (元の 255,255,255, 0.05 に相当)
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
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    gap: 16,
    paddingHorizontal: 16,
  },
  animatedCardItem: {
    width: 160,
    aspectRatio: 1,
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
