import React, { memo, useCallback } from "react";
import Song from "@/types";
import { useSongOptionsMenu } from "@/hooks/common/useSongOptionsMenu";
import ItemOptionsButton from "@/components/item/ItemOptionsButton";
import ItemOptionsSheet from "@/components/item/ItemOptionsSheet";

interface ItemOptionsMenuProps {
  song: Song;
  onDelete?: () => void;
  currentPlaylistId?: string;
}

function ItemOptionsMenu({
  song,
  onDelete,
  currentPlaylistId,
}: ItemOptionsMenuProps) {
  const {
    selectedSong,
    isSongOptionsVisible,
    openSongOptions,
    closeSongOptions,
  } = useSongOptionsMenu();

  const handleOpenModal = useCallback(() => {
    openSongOptions(song);
  }, [openSongOptions, song]);

  return (
    <>
      <ItemOptionsButton onPress={handleOpenModal} />
      <ItemOptionsSheet
        song={selectedSong}
        onDelete={onDelete}
        currentPlaylistId={currentPlaylistId}
        visible={isSongOptionsVisible}
        onClose={closeSongOptions}
      />
    </>
  );
}

export { ItemOptionsMenu, ItemOptionsButton, ItemOptionsSheet };

export default memo(ItemOptionsMenu, (prevProps, nextProps) => {
  return (
    prevProps.song.id === nextProps.song.id &&
    prevProps.onDelete === nextProps.onDelete &&
    prevProps.currentPlaylistId === nextProps.currentPlaylistId
  );
});
