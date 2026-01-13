import React, { useRef, useCallback, useEffect, useMemo } from "react";
import { ViewToken, Dimensions } from "react-native";
import { FlashList } from "@shopify/flash-list";
import Song from "@/types";
import OnRepeatPlayerItem from "./OnRepeatPlayerItem";

const { height } = Dimensions.get("screen");

interface OnRepeatPlayerListProps {
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
 * OnRepeat Player のメインリストコンポーネント
 * FlashListを使用した縦スワイプ型のプレビューリスト
 */
export default function OnRepeatPlayerList({
  songs,
  currentIndex,
  onIndexChange,
  isParentFocused = true,
}: OnRepeatPlayerListProps) {
  const listRef = useRef<FlashList<Song>>(null);
  const hasScrolledRef = useRef(false);
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
      <OnRepeatPlayerItem
        song={item}
        isVisible={index === currentIndex && isParentFocused}
      />
    ),
    [currentIndex, isParentFocused]
  );

  const extraData = useMemo(
    () => ({ currentIndex, isParentFocused }),
    [currentIndex, isParentFocused]
  );

  // リストが非表示になったらスクロール済みフラグをリセット
  useEffect(() => {
    if (!isParentFocused) {
      hasScrolledRef.current = false;
    }
  }, [isParentFocused]);

  // 初回マウント時または再表示時に指定インデックスへスクロール
  useEffect(() => {
    if (
      isParentFocused &&
      !hasScrolledRef.current &&
      listRef.current &&
      songs.length > 0
    ) {
      if (currentIndex > 0) {
        // 少し遅延させてFlashListのレイアウトが完了してからスクロール
        const timer = setTimeout(() => {
          listRef.current?.scrollToIndex({
            index: currentIndex,
            animated: false,
          });
        }, 100);
        hasScrolledRef.current = true;
        return () => clearTimeout(timer);
      } else {
        hasScrolledRef.current = true;
      }
    }
  }, [currentIndex, songs.length, isParentFocused]);

  // 親がフォーカスを失った場合はリストをアンマウントしてリソースを解放
  if (!isParentFocused) {
    return null;
  }

  return (
    <FlashList
      ref={listRef}
      data={songs}
      extraData={extraData}
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

