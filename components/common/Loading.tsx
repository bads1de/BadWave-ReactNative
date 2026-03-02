import React, { memo } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import HomeSkeleton from "@/components/common/HomeSkeleton";
import ListSkeleton from "@/components/common/ListSkeleton";
import GridSkeleton from "@/components/common/GridSkeleton";
import PlaylistDetailSkeleton from "@/components/common/PlaylistDetailSkeleton";
import SongDetailSkeleton from "@/components/common/SongDetailSkeleton";

export type LoadingVariant =
  | "spinner"
  | "home"
  | "list"
  | "grid"
  | "playlist-detail"
  | "song-detail";

interface LoadingProps {
  size?: "small" | "large" | number;
  color?: string;
  testID?: string;
  /**
   * ローディング演出の種類。
   * - "spinner"         : スピナー（デフォルト）
   * - "home"            : ホーム画面スケルトン
   * - "list"            : 縦リストスケルトン（検索・ジャンル・ライブラリ Liked など）
   * - "grid"            : グリッドスケルトン（ライブラリ プレイリスト一覧など）
   * - "playlist-detail" : プレイリスト詳細スケルトン
   * - "song-detail"     : 楽曲詳細スケルトン
   */
  variant?: LoadingVariant;
  /** variant="list" のとき渡す Props */
  listProps?: React.ComponentProps<typeof ListSkeleton>;
  /** variant="grid" のとき渡す Props */
  gridProps?: React.ComponentProps<typeof GridSkeleton>;
  /** variant="playlist-detail" のとき渡す Props */
  playlistDetailProps?: React.ComponentProps<typeof PlaylistDetailSkeleton>;
  /** variant="song-detail" のとき渡す Props */
  songDetailProps?: React.ComponentProps<typeof SongDetailSkeleton>;
}

/**
 * ローディングコンポーネント。
 * variant に応じてスピナーまたは各画面専用のスケルトンを表示する。
 *
 * @param {string} [props.testID] - テスト用のID（spinner のみ）
 */
function Loading({
  size,
  color,
  testID,
  variant = "spinner",
  listProps,
  gridProps,
  playlistDetailProps,
  songDetailProps,
}: LoadingProps) {
  const colors = useThemeStore((state) => state.colors);

  if (variant === "home") {
    return <HomeSkeleton />;
  }

  if (variant === "list") {
    return <ListSkeleton {...listProps} />;
  }

  if (variant === "grid") {
    return <GridSkeleton {...gridProps} />;
  }

  if (variant === "playlist-detail") {
    return <PlaylistDetailSkeleton {...playlistDetailProps} />;
  }

  if (variant === "song-detail") {
    return <SongDetailSkeleton {...songDetailProps} />;
  }

  // デフォルト: spinner
  const indicatorColor = color || colors.primary;

  return (
    <View
      style={[styles.container, { backgroundColor: colors.background }]}
      testID={testID || "loading-container"}
    >
      <ActivityIndicator
        size={size}
        color={indicatorColor}
        testID="loading-indicator"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default memo(Loading);
