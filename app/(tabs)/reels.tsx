/**
 * @file reels.tsx
 * @description Reels（ショート動画）機能のメイン画面コンポーネントです。
 *
 * この画面では、スポットライトとして選ばれた楽曲のショート動画を全画面で表示し、
 * ユーザーがスワイプで動画を切り替えられるようにします。
 *
 * 主な機能：
 * - `useGetLocalSpotlights` を使用してスポットライトデータを取得します（Local-First）。
 * - 画面がフォーカスされた際に、ヘッダーとミニプレイヤーを非表示にし、全画面での視聴体験を提供します。
 * - データ取得中のローディング状態やエラー状態を適切にハンドリングします。
 * - `ReelsList` コンポーネントに取得したデータを渡し、動画のリストを表示します。
 * - オフライン時は利用不可画面を表示します。
 */
import React, { useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import ReelsList from "@/components/reels/ReelsList";
import Loading from "@/components/common/Loading";
import Error from "@/components/common/Error";
import { useHeaderStore } from "@/hooks/useHeaderStore";
import { usePlayerStore } from "@/hooks/usePlayerStore";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useGetLocalSpotlights } from "@/hooks/data/useGetLocalSpotlights";
import { Ionicons } from "@expo/vector-icons";

export default function ReelsScreen() {
  const isFocused = useIsFocused();
  const setShowHeader = useHeaderStore((state) => state.setShowHeader);
  const setIsMiniPlayerVisible = usePlayerStore(
    (state) => state.setIsMiniPlayerVisible
  );
  const { isOnline } = useNetworkStatus();

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

  // スポットライトのデータをローカルから取得
  const { data: spotlights = [], isLoading, error } = useGetLocalSpotlights();

  if (!isOnline) {
    return (
      <View style={[styles.container, styles.center]}>
        <Ionicons name="cloud-offline" size={64} color="#666" />
        <Text style={styles.emptyText}>You are offline</Text>
        <Text style={styles.emptySubText}>
          Reels are only available when online
        </Text>
      </View>
    );
  }

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
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    marginTop: 16,
  },
  emptySubText: {
    color: "#444",
    fontSize: 14,
    marginTop: 8,
  },
});
