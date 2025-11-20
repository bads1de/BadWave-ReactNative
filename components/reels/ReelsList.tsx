import React, { useState, useRef, useCallback } from "react";
import { FlatList, ViewToken, Dimensions } from "react-native";
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

  const flatListRef = useRef<FlatList<Spotlight>>(null);

  const scrollToNext = useCallback(() => {
    if (currentVisibleIndex < data.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentVisibleIndex + 1,
        animated: true,
      });
    }
  }, [currentVisibleIndex, data.length]);

  const renderItem = useCallback(
    ({ item, index }: { item: Spotlight; index: number }) => (
      <ReelItem
        item={item}
        isVisible={index === currentVisibleIndex && isParentFocused}
        onFinish={scrollToNext}
      />
    ),
    [currentVisibleIndex, isParentFocused, scrollToNext]
  );

  const getItemLayout = useCallback(
    (_data: ArrayLike<Spotlight> | null | undefined, index: number) => ({
      length: height,
      offset: height * index,
      index,
    }),
    []
  );

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={height} // 画面全体の高さでスナップ
      snapToAlignment="start"
      decelerationRate="fast"
      onViewableItemsChanged={onViewableItemsChanged}
      viewabilityConfig={viewabilityConfig}
      getItemLayout={getItemLayout}
      windowSize={3} // Optimize memory
      removeClippedSubviews={true}
      initialNumToRender={10}
      maxToRenderPerBatch={2}
    />
  );
}
