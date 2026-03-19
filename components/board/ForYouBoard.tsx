import React, { useCallback, memo } from "react";
import { View, Text, StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";
import SongItem from "@/components/item/SongItem";
import { ListItemOptionsSheet } from "@/components/item/ListItemOptionsMenu";
import { useGetLocalRecommendations } from "@/hooks/data/useGetLocalRecommendations";
import { usePlayControls } from "@/hooks/audio/useAudioPlayer";
import { useAuth } from "@/providers/AuthProvider";
import Error from "@/components/common/Error";
import Loading from "@/components/common/Loading";
import Song from "@/types";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useSongOptionsMenu } from "@/hooks/common/useSongOptionsMenu";
import { useStableCallback } from "@/hooks/common/useStableCallback";

function ForYouBoard() {
  const { session } = useAuth();
  const userId = session?.user?.id;
  // ネットワーク状態はここで1回だけ取得し、各 SongItem に props として渡す
  const { isOnline } = useNetworkStatus();

  // SQLite から取得（Local-First）
  const {
    data: recommendations = [],
    isLoading,
    error,
  } = useGetLocalRecommendations(userId);

  const { togglePlayPause } = usePlayControls(recommendations, "forYou");
  const {
    selectedSong,
    isSongOptionsVisible,
    openSongOptions,
    closeSongOptions,
  } = useSongOptionsMenu();

  // 曲をクリックしたときのハンドラをメモ化
  const handleSongClick = useStableCallback(
    async (songId: string) => {
      const song = recommendations.find((s) => s.id === songId);
      if (song) {
        await togglePlayPause(song);
      }
    },
  );

  // レンダリング関数をメモ化
  const renderItem = useCallback(
    ({ item }: { item: Song }) => (
      <SongItem
        song={item}
        key={item.id}
        onClick={handleSongClick}
        onOpenMenu={openSongOptions}
        dynamicSize={false}
        isOnline={isOnline}
      />
    ),
    [handleSongClick, isOnline, openSongOptions],
  );

  // keyExtractor関数をメモ化
  const keyExtractor = useCallback((item: Song) => item.id, []);

  if (isLoading)
    return (
      <Loading
        variant="list"
        listProps={{ count: 3, avatarSize: 64, paddingHorizontal: 16 }}
      />
    );
  if (error) return <Error message={error.message} />;

  if (recommendations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          まだおすすめの曲がありません。もっと曲を聴いて、あなた好みの曲をおすすめします。
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlashList
        data={recommendations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        estimatedItemSize={180}
        removeClippedSubviews={true}
        overrideItemLayout={(layout) => {
          layout.size = 200; // SongItem + マージンの幅
        }}
      />
      <ListItemOptionsSheet
        song={selectedSong}
        visible={isSongOptionsVisible}
        onClose={closeSongOptions}
      />
    </View>
  );
}

export default memo(ForYouBoard);

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: 320,
  },
  listContent: {
    paddingVertical: 8,
  },
  loadingContainer: {
    height: 320,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#ccc",
    fontSize: 16,
    textAlign: "center",
    lineHeight: 24,
  },
});
