import React, { memo } from "react";
import Song from "@/types";
import ItemOptionsModal from "@/components/item/ItemOptionsModal";

interface ItemOptionsSheetProps {
  song: Song | null;
  onDelete?: () => void;
  currentPlaylistId?: string;
  visible: boolean;
  onClose: () => void;
}

/**
 * song が選択されている場合のみオプションシートを表示するラッパー。
 */
export const ItemOptionsSheet = memo(function ItemOptionsSheet({
  song,
  onDelete,
  currentPlaylistId,
  visible,
  onClose,
}: ItemOptionsSheetProps) {
  if (!song) {
    return null;
  }

  return (
    <ItemOptionsModal
      song={song}
      onDelete={onDelete}
      currentPlaylistId={currentPlaylistId}
      modalVisible={visible}
      handleCloseModal={onClose}
    />
  );
});

export default ItemOptionsSheet;
