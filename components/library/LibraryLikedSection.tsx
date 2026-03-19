import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { FlashList } from "@shopify/flash-list";
import { Heart } from "lucide-react-native";
import SongItem from "@/components/item/SongItem";
import { BulkDownloadButton } from "@/components/download/BulkDownloadButton";
import { LibraryEmptyState } from "@/components/library/LibraryEmptyState";
import { usePlayControls } from "@/hooks/audio/useAudioPlayer";
import { useStableCallback } from "@/hooks/common/useStableCallback";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { COLORS, FONTS } from "@/constants/theme";
import Song from "@/types";

interface LibraryLikedSectionProps {
  songs: Song[];
  isOnline: boolean;
  onOpenSongOptions: (song: Song) => void;
}

function LibraryLikedSectionInner({
  songs,
  isOnline,
  onOpenSongOptions,
}: LibraryLikedSectionProps) {
  const colors = useThemeStore((state) => state.colors);
  const { togglePlayPause } = usePlayControls(songs, "liked");
  const [isScrolling, setIsScrolling] = useState(false);
  const marqueeResumeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const clearMarqueeResumeTimeout = useCallback(() => {
    if (marqueeResumeTimeoutRef.current) {
      clearTimeout(marqueeResumeTimeoutRef.current);
      marqueeResumeTimeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearMarqueeResumeTimeout();
    };
  }, [clearMarqueeResumeTimeout]);

  const handleLikedListScrollStart = useCallback(() => {
    clearMarqueeResumeTimeout();
    setIsScrolling(true);
  }, [clearMarqueeResumeTimeout]);

  const handleLikedListScrollStop = useCallback(() => {
    clearMarqueeResumeTimeout();
    marqueeResumeTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      marqueeResumeTimeoutRef.current = null;
    }, 350);
  }, [clearMarqueeResumeTimeout]);

  const handleSongPress = useStableCallback(async (songId: string) => {
    const song = songs.find((item) => item.id === songId);
    if (song) {
      await togglePlayPause(song);
    }
  });

  const renderLikedSong = useCallback(
    ({ item }: { item: Song }) => (
      <SongItem
        song={item}
        onClick={handleSongPress}
        onOpenMenu={onOpenSongOptions}
        dynamicSize
        isOnline={isOnline}
        pauseTitleAnimation={isScrolling}
      />
    ),
    [handleSongPress, isOnline, isScrolling, onOpenSongOptions],
  );

  const keyExtractor = useCallback((item: Song) => item.id, []);

  if (songs.length === 0) {
    return (
      <LibraryEmptyState
        icon={
          <Heart
            size={48}
            color={COLORS.primary}
            strokeWidth={1}
            opacity={0.4}
          />
        }
        title="Pure Silence"
        subtitle="Your heart hasn't found its rhythm yet. Start liking songs to curate your sanctuary."
      />
    );
  }

  return (
    <View style={styles.contentArea}>
      <Animated.View entering={FadeInDown} style={styles.utilityRow}>
        <View
          style={[
            styles.countBadge,
            { backgroundColor: "rgba(255, 255, 255, 0.05)" },
          ]}
        >
          <Text style={[styles.countText, { color: colors.subText }]}>
            {songs.length} Tracks
          </Text>
        </View>
        <BulkDownloadButton songs={songs} size="small" />
      </Animated.View>

      <FlashList
        key="liked"
        data={songs}
        renderItem={renderLikedSong}
        keyExtractor={keyExtractor}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        estimatedItemSize={280}
        showsVerticalScrollIndicator={false}
        onScrollBeginDrag={handleLikedListScrollStart}
        onMomentumScrollBegin={handleLikedListScrollStart}
        onScrollEndDrag={handleLikedListScrollStop}
        onMomentumScrollEnd={handleLikedListScrollStop}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contentArea: {
    flex: 1,
  },
  utilityRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  countBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  countText: {
    fontSize: 12,
    fontFamily: FONTS.semibold,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 120,
  },
});

export const LibraryLikedSection = memo(LibraryLikedSectionInner);

