import React, { useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
  Dimensions,
  Animated,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import getPlaylistSongs from "@/actions/getPlaylistSongs";
import ListItem from "@/components/ListItem";
import Loading from "@/components/Loading";
import Error from "@/components/Error";
import { SafeAreaView } from "react-native-safe-area-context";
import Song from "@/types";
import { CACHED_QUERIES } from "@/constants";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import getPlaylistById from "@/actions/getPlaylistById";
import { useAuth } from "@/providers/AuthProvider";
import PlaylistOptionsMenu from "@/components/PlaylistOptionsMenu";
import Toast from "react-native-toast-message";
import deletePlaylistSong from "@/actions/deletePlaylistSong";
import { useHeaderStore } from "@/hooks/useHeaderStore";

const { width } = Dimensions.get("window");

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const { playlistId } = useLocalSearchParams<{ playlistId: string }>();
  const { session } = useAuth();
  const queryClient = useQueryClient();
  const { setShowHeader } = useHeaderStore();

  useFocusEffect(
    useCallback(() => {
      setShowHeader(false);
      return () => {
        setShowHeader(true);
      };
    }, [setShowHeader])
  );

  // 削除のミューテーションを追加
  const { mutate: handleDeleteSong } = useMutation({
    mutationFn: ({ songId, songType }: { songId: string; songType: string }) =>
      deletePlaylistSong(playlistId, songId, songType),
    onSuccess: () => {
      // キャッシュを更新
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistSongs, playlistId],
      });

      Toast.show({
        type: "success",
        text1: "曲を削除しました",
      });
    },
    onError: (error: any) => {
      Toast.show({
        type: "error",
        text1: "エラーが発生しました",
        text2: error.message,
      });
    },
  });

  const scrollY = new Animated.Value(0);
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.2],
    extrapolate: "clamp",
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: "clamp",
  });

  const {
    data: playlistSongs = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.playlistSongs, playlistId],
    queryFn: () => getPlaylistSongs(playlistId),
    enabled: !!playlistId,
  });

  const {
    data: playlist,
    isLoading: isLoadingPlaylist,
    error: playlistError,
  } = useQuery({
    queryKey: [CACHED_QUERIES.playlistById, playlistId],
    queryFn: () => getPlaylistById(playlistId),
    enabled: !!playlistId,
  });

  const { togglePlayPause } = useAudioPlayer(
    playlistSongs,
    "playlist",
    playlistId
  );

  const renderSongs = useCallback(
    ({ item }: { item: Song }) => (
      <ListItem
        song={item}
        onPress={async () => await togglePlayPause(item)}
        imageSize="medium"
        showStats={true}
        onDelete={
          session?.user.id === playlist?.user_id
            ? () => handleDeleteSong({ songId: item.id, songType: "regular" })
            : undefined
        }
      />
    ),
    [togglePlayPause, session?.user.id, playlist?.user_id, handleDeleteSong]
  );

  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: headerOpacity,
          transform: [{ scale: headerScale }],
        },
      ]}
    >
      <View style={styles.thumbnailContainer}>
        <View style={styles.decorativeCard1} />
        <View style={styles.decorativeCard2} />
        <View style={styles.decorativeCard3} />

        <Image
          source={{ uri: playlist?.image_path }}
          style={styles.thumbnail}
        />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.thumbnailGradient}
        />
        <LinearGradient
          colors={["#fc00ff", "#00dbde"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.neonGradient}
        />
      </View>

      <BlurView intensity={30} tint="dark" style={styles.infoContainer}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
            {playlist?.title}
          </Text>
          {playlist?.is_public && (
            <View style={styles.privacyBadge}>
              <Ionicons name="globe-outline" size={16} color="#fff" />
              <Text style={styles.privacyText}>Public</Text>
            </View>
          )}
          {!playlist?.is_public && (
            <View style={[styles.privacyBadge, styles.privateBadge]}>
              <Ionicons name="lock-closed" size={16} color="#fff" />
              <Text style={styles.privacyText}>Private</Text>
            </View>
          )}
        </View>

        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Ionicons name="musical-notes" size={18} color="#fc00ff" />
            <Text style={styles.metaText}>{playlistSongs.length} songs</Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <Ionicons name="person" size={18} color="#00dbde" />
            <Text style={styles.metaText}>
              {playlist?.user_id === session?.user.id
                ? "Created by you"
                : "Created by others"}
            </Text>
          </View>
          <View style={styles.metaDot} />
          <View style={styles.metaItem}>
            <Ionicons name="calendar" size={18} color="#fc00ff" />
            <Text style={styles.metaText}>
              {new Date(playlist?.created_at! || "").toLocaleDateString()}
            </Text>
          </View>
        </View>

        {session?.user.id === playlist?.user_id && (
          <View style={styles.optionsContainer}>
            <PlaylistOptionsMenu
              playlistId={playlistId}
              userId={playlist?.user_id}
              currentTitle={playlist?.title}
              isPublic={playlist?.is_public}
            />
          </View>
        )}
      </BlurView>
    </Animated.View>
  );

  if (isLoading || isLoadingPlaylist) return <Loading />;
  if (error || playlistError)
    return <Error message={error?.message || playlistError?.message} />;

  return (
    <SafeAreaView style={styles.container}>
      {playlistSongs && playlistSongs.length > 0 ? (
        <FlatList
          data={playlistSongs}
          keyExtractor={(item: Song) => item.id}
          renderItem={renderSongs}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.listContent}
          numColumns={1}
          key="playlist-songs-list"
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
        />
      ) : (
        <>
          {renderHeader()}
          <View style={styles.emptyContainer}>
            <Ionicons name="musical-notes" size={48} color="#666" />
            <Text style={styles.emptyText}>No songs in this playlist</Text>
            <Text style={styles.emptySubText}>
              Add some songs to get started
            </Text>
          </View>
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
    width: "100%",
    paddingBottom: 20,
  },
  backButton: {
    position: "absolute",
    top: 10,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#fc00ff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  thumbnailContainer: {
    width: width,
    height: width * 0.9,
    position: "relative",
    marginBottom: 20,
  },
  decorativeCard1: {
    position: "absolute",
    width: "96%",
    height: "96%",
    backgroundColor: "rgba(252, 0, 255, 0.15)",
    borderRadius: 20,
    transform: [
      { rotate: "5deg" },
      { scale: 0.98 },
      { translateX: 8 },
      { translateY: 2 },
    ],
    shadowColor: "#fc00ff",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  decorativeCard2: {
    position: "absolute",
    width: "96%",
    height: "96%",
    backgroundColor: "rgba(0, 219, 222, 0.15)",
    borderRadius: 20,
    transform: [
      { rotate: "-7deg" },
      { scale: 0.96 },
      { translateX: -4 },
      { translateY: 4 },
    ],
    shadowColor: "#00dbde",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  decorativeCard3: {
    position: "absolute",
    width: "96%",
    height: "96%",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 20,
    transform: [
      { rotate: "2deg" },
      { scale: 0.94 },
      { translateX: 2 },
      { translateY: -2 },
    ],
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    borderRadius: 20,
  },
  neonGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  thumbnailGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "80%",
    borderRadius: 20,
  },
  infoContainer: {
    padding: 20,
    marginTop: -60,
    marginHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(20, 20, 20, 0.7)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  title: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    flex: 1,
    marginRight: 12,
    textShadowColor: "rgba(252, 0, 255, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 10,
  },
  privacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(0, 219, 222, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(0, 219, 222, 0.5)",
  },
  privateBadge: {
    backgroundColor: "rgba(252, 0, 255, 0.2)",
    borderColor: "rgba(252, 0, 255, 0.5)",
  },
  privacyText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
  },
  metaText: {
    color: "#ccc",
    fontSize: 14,
    marginLeft: 6,
    fontWeight: "500",
  },
  metaDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    marginHorizontal: 8,
  },
  optionsContainer: {
    alignItems: "flex-end",
    marginTop: 8,
  },
  listContent: {
    paddingBottom: 96,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#fff",
    fontSize: 18,
    marginTop: 16,
  },
  emptySubText: {
    color: "#666",
    fontSize: 14,
    marginTop: 8,
  },
});
