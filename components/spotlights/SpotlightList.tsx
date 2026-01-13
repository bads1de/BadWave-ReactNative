import React, { useState, useRef, useCallback } from "react";
import { ViewToken, Dimensions } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Spotlight } from "@/types";
import SpotlightItem from "./SpotlightItem";

interface SpotlightListProps {
  data: Spotlight[];
  isParentFocused?: boolean;
}

const { height } = Dimensions.get("window");

export default function SpotlightList({
  data,
  isParentFocused = true,
}: SpotlightListProps) {
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
      <SpotlightItem
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
      drawDistance={height}
    />
  );
}

