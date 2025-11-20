/**
 * @file reels.tsx
 * @description Reels（ショート動画）機能のメイン画面コンポーネントです。
 *
 * この画面では、スポットライトとして選ばれた楽曲のショート動画を全画面で表示し、
 * ユーザーがスワイプで動画を切り替えられるようにします。
 *
 * 主な機能：
 * - `@tanstack/react-query` を使用してスポットライトデータを非同期に取得します。
 * - 画面がフォーカスされた際に、ヘッダーとミニプレイヤーを非表示にし、全画面での視聴体験を提供します。
 * - データ取得中のローディング状態やエラー状態を適切にハンドリングします。
 * - `ReelsList` コンポーネントに取得したデータを渡し、動画のリストを表示します。
 */
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useIsFocused } from "@react-navigation/native";
import getSpotlights from "@/actions/getSpotlights";
import ReelsList from "@/components/reels/ReelsList";
import Loading from "@/components/common/Loading";
import Error from "@/components/common/Error";
import { CACHED_QUERIES } from "@/constants";
import { useHeaderStore } from "@/hooks/useHeaderStore";
import { usePlayerStore } from "@/hooks/usePlayerStore";

export default function ReelsScreen() {
  const isFocused = useIsFocused();
  const setShowHeader = useHeaderStore((state) => state.setShowHeader);
  const setIsMiniPlayerVisible = usePlayerStore(
    (state) => state.setIsMiniPlayerVisible
  );

  // 画面のフォーカス状態に応じてUI（ヘッダー、ミニプレイヤー）の表示/非表示を切り替えます。
  useEffect(() => {
    if (isFocused) {
      setShowHeader(false);
      setIsMiniPlayerVisible(false);
    } else {
      setShowHeader(true);
      setIsMiniPlayerVisible(true);
    }
    // クリーンアップ関数：画面から離れる際にUIを元の状態に戻します。
    return () => {
      setShowHeader(true);
      setIsMiniPlayerVisible(true);
    };
  }, [isFocused, setShowHeader, setIsMiniPlayerVisible]);

  // スポットライトのデータを取得するためのクエリです。
  const {
    data: spotlights = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: [CACHED_QUERIES.spotlights],
    queryFn: getSpotlights,
  });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <View style={styles.container}>
      <ReelsList data={spotlights} isParentFocused={isFocused} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
});
