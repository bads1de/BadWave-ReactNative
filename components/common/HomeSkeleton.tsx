import React, { memo } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import SkeletonBox from "@/components/common/SkeletonBox";

const BG = "#0A0A0A";
const GAP = 16;

/**
 * ホーム画面の読み込み中に表示するスケルトン
 * - Hero カード
 * - セクションタイトル
 * - 横スクロールの曲カード × 3
 * を模した構成
 */
function HomeSkeleton() {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      scrollEnabled={false}
      testID="home-skeleton"
    >
      {/* Hero セクション */}
      <SkeletonBox height={220} borderRadius={20} style={styles.hero} />

      {/* Trending section */}
      <SectionSkeleton />

      {/* For You section */}
      <SectionSkeleton />

      {/* Collections section */}
      <SectionSkeleton cardHeight={80} horizontal={false} count={3} />
    </ScrollView>
  );
}

interface SectionSkeletonProps {
  cardHeight?: number;
  horizontal?: boolean;
  count?: number;
}
function SectionSkeleton({
  cardHeight = 160,
  horizontal = true,
  count = 3,
}: SectionSkeletonProps) {
  return (
    <View style={styles.section}>
      {/* タイトル行 */}
      <View style={styles.titleRow}>
        <SkeletonBox width={18} height={18} borderRadius={4} />
        <SkeletonBox width="45%" height={22} borderRadius={6} />
      </View>

      {/* カード列 */}
      <View style={[styles.cards, horizontal && styles.cardsHorizontal]}>
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonBox
            key={i}
            width={horizontal ? 150 : "100%"}
            height={cardHeight}
            borderRadius={14}
            style={horizontal ? styles.cardH : styles.cardV}
            testID={`skeleton-card-${i}`}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    padding: 24,
    paddingBottom: 120,
  },
  hero: {
    marginBottom: 32,
  },
  section: {
    marginBottom: 40,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  cards: {
    gap: GAP,
  },
  cardsHorizontal: {
    flexDirection: "row",
  },
  cardH: {
    marginRight: GAP,
  },
  cardV: {
    marginBottom: GAP,
  },
});

export default memo(HomeSkeleton);
