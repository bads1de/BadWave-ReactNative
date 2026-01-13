import React, { useRef, useCallback, useEffect } from "react";
import { ViewToken, Dimensions } from "react-native";
import { FlashList } from "@shopify/flash-list";
import Song from "@/types";
import QuickListenItem from "./QuickListenItem";

const { height } = Dimensions.get("screen");

interface QuickListenListProps {
  /** 表示する曲のリスト */
  songs: Song[];
  /** 現在表示中の曲のインデックス */
  currentIndex: number;
  /** インデックス変更時のコールバック */
  onIndexChange: (index: number) => void;
  /** 親がフォーカスされているか（falseの場合はnullを返してリソース解放） */
  isParentFocused?: boolean;
}

/**
 * Quick Listen のメインリストコンポーネント
 * FlashListを使用した縦スワイプ型のプレビューリスト
 */
export default function QuickListenList({
  songs,
  currentIndex,
  onIndexChange,
  isParentFocused = true,
}: QuickListenListProps) {
  const listRef = useRef<FlashList<Song>>(null);
  // 現在のインデックスをrefで保持（onViewableItemsChanged内からアクセスするため）
  const currentIndexRef = useRef(currentIndex);
  currentIndexRef.current = currentIndex;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0) {
        const visibleItem = viewableItems[0];
        if (
          visibleItem.index !== null &&
          visibleItem.index !== currentIndexRef.current
        ) {
          onIndexChange(visibleItem.index);
        }
      }
    }
  ).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const renderItem = useCallback(
    ({ item, index }: { item: Song; index: number }) => (
      <QuickListenItem
        song={item}
        isVisible={index === currentIndex && isParentFocused}
      />
    ),
    [currentIndex, isParentFocused]
  );

  // 初回マウント時に指定されたインデックスにスクロール
  useEffect(() => {
    if (listRef.current && songs.length > 0 && currentIndex > 0) {
      // 少し遅延させてFlashListのレイアウトが完了してからスクロール
      const timer = setTimeout(() => {
        listRef.current?.scrollToIndex({
          index: currentIndex,
          animated: false,
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []); // 初回のみ実行

  // 親がフォーカスを失った場合はリストをアンマウントしてリソースを解放
  if (!isParentFocused) {
    return null;
  }

  return (
    <FlashList
      ref={listRef}
      data={songs}
      extraData={currentIndex}
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
      initialScrollIndex={currentIndex}
    />
  );
}
