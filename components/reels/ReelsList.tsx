import React, { useState, useRef, useCallback } from "react";
import { ViewToken, Dimensions } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Spotlight } from "@/types";
import ReelItem from "./ReelItem";

interface ReelsListProps {
  data: Spotlight[];
  isParentFocused?: boolean;
}

const { height } = Dimensions.get("window");

export default function ReelsList({
  data,
  isParentFocused = true,
}: ReelsListProps) {
  const [currentVisibleIndex, setCurrentVisibleIndex] = useState(0);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const visibleItem = viewableItems[0];

        if (visibleItem.index !== null) {
          setCurrentVisibleIndex(visibleItem.index);
        }
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = useCallback(
    ({ item, index }: { item: Spotlight; index: number }) => (
      <ReelItem
        item={item}
        isVisible={index === currentVisibleIndex && isParentFocused}
      />
    ),
    [currentVisibleIndex, isParentFocused]
  );

  // タブがフォーカスを失った場合はリストをアンマウントしてリソースを解放
  if (!isParentFocused) {
    return null;
  }

  return (
    <FlashList
      data={data}
      extraData={currentVisibleIndex}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={height}
      decelerationRate="fast"
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      estimatedItemSize={height}
      // パフォーマンス最適化：画面外のアイテムの事前描画を最小限に
      drawDistance={height}
    />
  );
}
