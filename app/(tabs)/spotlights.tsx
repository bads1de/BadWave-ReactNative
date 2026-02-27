/**
 * @file spotlights.tsx
 * @description Spotlights（注目の楽曲動画）機能のメイン画面コンポーネントです。
 */
import React, { useEffect } from "react";
import { View, StyleSheet, Text } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import SpotlightList from "@/components/spotlights/SpotlightList";
import Loading from "@/components/common/Loading";
import Error from "@/components/common/Error";
import { useHeaderStore } from "@/hooks/stores/useHeaderStore";
import { usePlayerStore } from "@/hooks/stores/usePlayerStore";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useGetLocalSpotlights } from "@/hooks/data/useGetLocalSpotlights";
import { CloudOff } from "lucide-react-native";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { FONTS } from "@/constants/theme";

export default function SpotlightsScreen() {
  const isFocused = useIsFocused();
  const setShowHeader = useHeaderStore((state) => state.setShowHeader);
  const setIsMiniPlayerVisible = usePlayerStore(
    (state) => state.setIsMiniPlayerVisible
  );
  const { isOnline } = useNetworkStatus();
  const { colors } = useThemeStore();

  // 画面のフォーカス状態に応じてUI（ヘッダー、ミニプレイヤー）の表示/非表示を切り替えます。
  useEffect(() => {
    if (isFocused) {
      setShowHeader(false);
      setIsMiniPlayerVisible(false);
    } else {
      setShowHeader(true);
      setIsMiniPlayerVisible(true);
    }
  }, [isFocused, setShowHeader, setIsMiniPlayerVisible]);

  // スポットライトのデータをローカルから取得
  const { data: spotlights = [], isLoading, error } = useGetLocalSpotlights();

  if (!isOnline) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <CloudOff size={64} color={colors.subText} />
        <Text style={[styles.emptyText, { color: colors.text }]}>You are offline</Text>
        <Text style={[styles.emptySubText, { color: colors.subText }]}>
          Spotlights are only available when online
        </Text>
      </View>
    );
  }

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SpotlightList data={spotlights} isParentFocused={isFocused} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 18,
    fontFamily: FONTS.semibold,
    marginTop: 20,
  },
  emptySubText: {
    fontSize: 14,
    fontFamily: FONTS.body,
    marginTop: 8,
    opacity: 0.8,
  },
});

