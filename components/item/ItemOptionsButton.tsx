import React, { memo } from "react";
import { StyleSheet, TouchableOpacity } from "react-native";
import { MoreVertical } from "lucide-react-native";
import { useThemeStore } from "@/hooks/stores/useThemeStore";

interface ItemOptionsButtonProps {
  onPress: () => void;
  testID?: string;
}

/**
 * 楽曲アイテム用の「その他」メニューボタン。
 * ItemOptionsMenu から切り出した。
 */
export const ItemOptionsButton = memo(function ItemOptionsButton({
  onPress,
  testID = "menu-button",
}: ItemOptionsButtonProps) {
  const colors = useThemeStore((state) => state.colors);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.menuButton, { borderColor: colors.border }]}
      testID={testID}
    >
      <MoreVertical size={20} color={colors.text} strokeWidth={1.5} />
    </TouchableOpacity>
  );
});

export default ItemOptionsButton;

const styles = StyleSheet.create({
  menuButton: {
    padding: 8,
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
  },
});
