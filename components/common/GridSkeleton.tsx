import React, { memo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import SkeletonBox from "@/components/common/SkeletonBox";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface GridSkeletonProps {
  /** 表示するカード数 (デフォルト: 6) */
  count?: number;
  /** カラム数 (デフォルト: 2) */
  columns?: number;
  /** カード高さ px。未指定の場合はカード幅と同じ正方形になる */
  cardHeight?: number;
  /** カード間・外側のギャップ px (デフォルト: 12) */
  gap?: number;
  /** 水平パディング (デフォルト: 12) */
  paddingHorizontal?: number;
  /** セクションタイトル行を表示するか (デフォルト: false) */
  showHeader?: boolean;
}

/**
 * グリッドレイアウト用汎用スケルトン
 * ライブラリのいいね曲・プレイリスト一覧などに使用
 */
function GridSkeleton({
  count = 6,
  columns = 2,
  cardHeight,
  gap = 12,
  paddingHorizontal = 12,
  showHeader = false,
}: GridSkeletonProps) {
  const cardWidth =
    (SCREEN_WIDTH - paddingHorizontal * 2 - gap * (columns - 1)) / columns;
  const resolvedCardHeight = cardHeight ?? cardWidth;

  return (
    <View
      testID="grid-skeleton"
      style={[styles.container, { paddingHorizontal }]}
    >
      {showHeader && (
        <View
          testID="grid-skeleton-header"
          style={[styles.header, { marginBottom: gap * 2 }]}
        >
          <SkeletonBox width="30%" height={12} borderRadius={6} />
          <SkeletonBox width="55%" height={28} borderRadius={8} />
        </View>
      )}

      <View style={[styles.grid, { gap }]}>
        {Array.from({ length: count }).map((_, i) => (
          <View
            key={i}
            testID={`grid-skeleton-card-${i}`}
            style={[
              styles.card,
              {
                width: cardWidth,
                height: resolvedCardHeight,
                borderRadius: 14,
              },
            ]}
          >
            <SkeletonBox
              width="100%"
              height={resolvedCardHeight * 0.68}
              borderRadius={10}
            />
            <View style={[styles.cardInfo, { gap: gap * 0.5 }]}>
              <SkeletonBox width="80%" height={13} borderRadius={5} />
              <SkeletonBox width="50%" height={10} borderRadius={5} />
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    gap: 8,
    marginTop: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  card: {
    overflow: "hidden",
    paddingBottom: 12,
  },
  cardInfo: {
    paddingTop: 10,
    paddingHorizontal: 4,
  },
});

export default memo(GridSkeleton);
