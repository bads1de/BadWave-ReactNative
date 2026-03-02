import React, { memo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import SkeletonBox from "@/components/common/SkeletonBox";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import ListSkeleton from "@/components/common/ListSkeleton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface PlaylistDetailSkeletonProps {
  /** ヒーロー画像の高さ比率 (デフォルト: 1.05 = 画面幅の1.05倍) */
  heroHeightRatio?: number;
  /** 曲リストのアイテム数 (デフォルト: 5) */
  songCount?: number;
}

/**
 * プレイリスト詳細画面用スケルトン
 * - ヒーロー画像エリア
 * - 情報カード (タイトル・メタ・ボタン)
 * - 曲リスト
 */
function PlaylistDetailSkeleton({
  heroHeightRatio = 1.05,
  songCount = 5,
}: PlaylistDetailSkeletonProps) {
  const heroHeight = SCREEN_WIDTH * heroHeightRatio;
  const colors = useThemeStore((state) => state.colors);

  return (
    <View
      testID="playlist-detail-skeleton"
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* ヒーロー画像エリア */}
      <SkeletonBox
        testID="playlist-detail-skeleton-hero"
        width="100%"
        height={heroHeight}
        borderRadius={0}
      />

      {/* 情報カード */}
      <View
        testID="playlist-detail-skeleton-info"
        style={[styles.infoCard, { backgroundColor: colors.card + "D9" }]}
      >
        {/* タイトル行 */}
        <View style={styles.titleRow}>
          <SkeletonBox width="60%" height={28} borderRadius={8} />
          <SkeletonBox width={64} height={26} borderRadius={12} />
        </View>

        {/* メタ情報 */}
        <View style={styles.metaRow}>
          <SkeletonBox width={80} height={14} borderRadius={6} />
          <SkeletonBox width={4} height={4} borderRadius={2} />
          <SkeletonBox width={100} height={14} borderRadius={6} />
        </View>

        {/* アクションボタン */}
        <View style={styles.actionRow}>
          <SkeletonBox width={120} height={44} borderRadius={16} />
          <SkeletonBox width={44} height={44} borderRadius={12} />
        </View>
      </View>

      {/* 曲リスト */}
      <View style={styles.songList}>
        {Array.from({ length: songCount }).map((_, i) => (
          <View
            key={i}
            testID={`playlist-detail-skeleton-item-${i}`}
            style={styles.songItem}
          >
            <SkeletonBox width={56} height={56} borderRadius={10} />
            <View style={styles.songTextBlock}>
              <SkeletonBox width="65%" height={14} borderRadius={6} />
              <SkeletonBox width="40%" height={11} borderRadius={5} />
            </View>
            <SkeletonBox width={24} height={24} borderRadius={12} />
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
  infoCard: {
    marginTop: -(SCREEN_WIDTH * 1.05 * 0.35),
    marginHorizontal: 16,
    borderRadius: 28,
    padding: 24,
    gap: 20,
    marginBottom: 24,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  songList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  songItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    height: 72,
  },
  songTextBlock: {
    flex: 1,
    gap: 8,
  },
});

export default memo(PlaylistDetailSkeleton);
