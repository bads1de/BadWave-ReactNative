import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import SkeletonBox from "@/components/common/SkeletonBox";

interface ListSkeletonProps {
  /** 表示するアイテム数 (デフォルト: 5) */
  count?: number;
  /** サムネイル/アバター画像を表示するか (デフォルト: true) */
  showAvatar?: boolean;
  /** アバターのサイズ px (デフォルト: 56) */
  avatarSize?: number;
  /** アバターの角丸 (デフォルト: 10) */
  avatarRadius?: number;
  /** 各アイテムの高さ px (デフォルト: 72) */
  itemHeight?: number;
  /** リスト上部にセクションタイトル行を表示するか (デフォルト: false) */
  showHeader?: boolean;
  /** 水平パディング (デフォルト: 20) */
  paddingHorizontal?: number;
}

/**
 * 縦スクロールリスト用汎用スケルトン
 * 検索・ジャンル・プレイリスト曲リストなどに使用
 */
function ListSkeleton({
  count = 5,
  showAvatar = true,
  avatarSize = 56,
  avatarRadius = 10,
  itemHeight = 72,
  showHeader = false,
  paddingHorizontal = 20,
}: ListSkeletonProps) {
  return (
    <View
      testID="list-skeleton"
      style={[styles.container, { paddingHorizontal }]}
    >
      {showHeader && (
        <View testID="list-skeleton-header" style={styles.header}>
          <SkeletonBox width="30%" height={12} borderRadius={6} />
          <SkeletonBox width="60%" height={28} borderRadius={8} />
        </View>
      )}

      {Array.from({ length: count }).map((_, i) => (
        <View
          key={i}
          testID={`list-skeleton-item-${i}`}
          style={[styles.item, { height: itemHeight }]}
        >
          {showAvatar && (
            <SkeletonBox
              testID={`list-skeleton-avatar-${i}`}
              width={avatarSize}
              height={avatarSize}
              borderRadius={avatarRadius}
            />
          )}
          <View style={styles.textBlock}>
            <SkeletonBox width="65%" height={14} borderRadius={6} />
            <SkeletonBox
              width="40%"
              height={11}
              borderRadius={5}
              style={styles.subLine}
            />
          </View>
          <SkeletonBox width={32} height={32} borderRadius={16} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: 8,
    marginBottom: 24,
    marginTop: 8,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 12,
  },
  textBlock: {
    flex: 1,
    gap: 8,
  },
  subLine: {
    marginTop: 2,
  },
});

export default memo(ListSkeleton);
