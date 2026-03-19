import React, { memo, useCallback } from "react";
import { View, StyleSheet } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { ListMusic } from "lucide-react-native";
import PlaylistItem from "@/components/item/PlaylistItem";
import { LibraryEmptyState } from "@/components/library/LibraryEmptyState";
import { COLORS } from "@/constants/theme";
import { Playlist } from "@/types";

interface LibraryPlaylistsSectionProps {
  playlists: Playlist[];
  onPlaylistPress: (playlist: Playlist) => void;
}

function LibraryPlaylistsSectionInner({
  playlists,
  onPlaylistPress,
}: LibraryPlaylistsSectionProps) {
  const keyExtractor = useCallback((item: Playlist) => item.id, []);

  const renderPlaylistItem = useCallback(
    ({ item }: { item: Playlist }) => (
      <PlaylistItem playlist={item} onPress={onPlaylistPress} />
    ),
    [onPlaylistPress],
  );

  if (playlists.length === 0) {
    return (
      <LibraryEmptyState
        icon={
          <ListMusic
            size={48}
            color={COLORS.primary}
            strokeWidth={1}
            opacity={0.4}
          />
        }
        title="Blank Canvas"
        subtitle="Design your own musical journey. Create your first playlist to begin."
      />
    );
  }

  return (
    <View style={styles.contentArea}>
      <FlashList
        key="playlists"
        data={playlists}
        renderItem={renderPlaylistItem}
        numColumns={2}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContainer}
        estimatedItemSize={220}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  contentArea: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 12,
    paddingBottom: 120,
  },
});

export const LibraryPlaylistsSection = memo(LibraryPlaylistsSectionInner);

