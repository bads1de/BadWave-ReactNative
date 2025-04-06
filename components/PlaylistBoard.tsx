import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Image } from "expo-image";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Playlist } from "@/types";
import { CACHED_QUERIES } from "@/constants";
import getPublicPlaylists from "@/actions/getPublicPlaylists";
import { useQuery } from "@tanstack/react-query";
import { memo, useCallback } from "react";

const PlaylistBoard = () => {
  const { data: playlists = [] } = useQuery({
    queryKey: [CACHED_QUERIES.getPublicPlaylists],
    queryFn: () => getPublicPlaylists(),
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
    [router]
  );

  return (
    <View style={{ marginBottom: 16 }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          gap: 16,
          paddingHorizontal: 16,
        }}
      >
        {playlists.map((playlist, i) => (
          <Animated.View
            key={playlist.id}
            entering={FadeInDown.delay(i * 100)}
            style={{
              width: 160,
              aspectRatio: 1,
            }}
          >
            <TouchableOpacity
              onPress={() => handlePlaylistPress(playlist)}
              style={{
                flex: 1,
                borderRadius: 12,
                overflow: "hidden",
                backgroundColor: "rgba(23, 23, 23, 0.4)",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.05)",
              }}
            >
              {/* アートワーク */}
              <View style={{ flex: 1 }}>
                <Image
                  source={{
                    uri: playlist.image_path,
                  }}
                  style={{
                    width: "100%",
                    height: "100%",
                  }}
                  contentFit="cover"
                  cachePolicy="disk"
                />

                {/* オーバーレイグラデーション */}
                <View
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: "50%",
                    backgroundColor: "rgba(0, 0, 0, 0.5)",
                  }}
                />
              </View>

              {/* プレイリスト情報 */}
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: 16,
                }}
              >
                <View style={{ gap: 4 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "bold",
                      color: "white",
                    }}
                    numberOfLines={1}
                  >
                    {playlist.title}
                  </Text>

                  <Text
                    style={{
                      fontSize: 12,
                      color: "#D4D4D4",
                    }}
                    numberOfLines={1}
                  >
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
};

// メモ化してエクスポート
export default memo(PlaylistBoard);
