import React, { memo } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import SkeletonBox from "@/components/common/SkeletonBox";
import { useThemeStore } from "@/hooks/stores/useThemeStore";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

interface SongDetailSkeletonProps {
  /** ヒーロー画像の高さ比率 (デフォルト: 0.6 = 画面高さの60%) */
  heroHeightRatio?: number;
  /** 歌詞行数 (デフォルト: 8) */
  lyricsLineCount?: number;
}

/**
 * 楽曲詳細画面用スケルトン
 * - ヒーロー画像エリア
 * - タイトル・アーティスト
 * - メタ情報 (ジャンル・再生数・年)
 * - 歌詞エリア
 */
function SongDetailSkeleton({
  heroHeightRatio = 0.6,
  lyricsLineCount = 8,
}: SongDetailSkeletonProps) {
  const heroHeight = SCREEN_HEIGHT * heroHeightRatio;
  const colors = useThemeStore((state) => state.colors);

  return (
    <View
      testID="song-detail-skeleton"
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* ヒーロー画像エリア */}
      <SkeletonBox
        testID="song-detail-skeleton-hero"
        width="100%"
        height={heroHeight}
        borderRadius={0}
      />

      {/* メインコンテンツ */}
      <View
        style={[
          styles.mainContent,
          { backgroundColor: colors.background, marginTop: -40 },
        ]}
      >
        {/* タイトルセクション */}
        <View testID="song-detail-skeleton-title" style={styles.titleSection}>
          <SkeletonBox width="75%" height={48} borderRadius={10} />
          <SkeletonBox
            width="45%"
            height={22}
            borderRadius={8}
            style={styles.authorLine}
          />
        </View>

        {/* アクションバー */}
        <View style={styles.actionBar}>
          <SkeletonBox width={100} height={100} borderRadius={50} />
          <View style={styles.utilityIcons}>
            <SkeletonBox width={60} height={60} borderRadius={30} />
            <SkeletonBox width={60} height={60} borderRadius={30} />
          </View>
        </View>

        {/* メタ情報 */}
        <View testID="song-detail-skeleton-meta" style={styles.metaRow}>
          {["GENRE", "STREAMS", "YEAR"].map((_, i) => (
            <View key={i} style={styles.metaItem}>
              <SkeletonBox width="60%" height={10} borderRadius={4} />
              <SkeletonBox
                width="80%"
                height={18}
                borderRadius={6}
                style={styles.metaValue}
              />
            </View>
          ))}
        </View>

        {/* 歌詞セクション */}
        <View testID="song-detail-skeleton-lyrics" style={styles.lyricsSection}>
          <View style={styles.lyricsSectionHeader}>
            <SkeletonBox width={50} height={26} borderRadius={4} />
            <SkeletonBox width={140} height={24} borderRadius={6} />
          </View>

          <View
            style={[
              styles.lyricsBox,
              {
                backgroundColor: colors.card + "40",
                borderColor: colors.border,
              },
            ]}
          >
            {Array.from({ length: lyricsLineCount }).map((_, i) => (
              <SkeletonBox
                key={i}
                width={`${60 + ((i * 17) % 35)}%`}
                height={14}
                borderRadius={6}
                style={styles.lyricLine}
              />
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mainContent: {
    paddingHorizontal: 30,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 50,
    paddingBottom: 40,
  },
  titleSection: {
    marginBottom: 40,
    gap: 12,
  },
  authorLine: {
    marginTop: 4,
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 60,
  },
  utilityIcons: {
    flexDirection: "row",
    gap: 12,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 60,
  },
  metaItem: {
    flex: 1,
    gap: 8,
  },
  metaValue: {
    marginTop: 4,
  },
  lyricsSection: {
    gap: 24,
  },
  lyricsSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  lyricsBox: {
    borderRadius: 30,
    padding: 24,
    gap: 14,
    borderWidth: 1,
  },
  lyricLine: {
    marginVertical: 2,
  },
});

export default memo(SongDetailSkeleton);
