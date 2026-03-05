import React, { memo, useCallback } from "react";
import { View, StyleSheet, SafeAreaView, Text } from "react-native";
import { FlashList } from "@shopify/flash-list";
import { Search, CloudOff, Music, ListMusic } from "lucide-react-native";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { useSearchScreen, SearchType } from "@/hooks/useSearchScreen";
import { SearchBar } from "@/components/search/SearchBar";
import { SearchHistory } from "@/components/search/SearchHistory";
import { TabSwitcher, TabOption } from "@/components/common/TabSwitcher";
import ListItem from "@/components/item/ListItem";
import PlaylistItem from "@/components/item/PlaylistItem";
import Loading from "@/components/common/Loading";
import Error from "@/components/common/Error";
import { FONTS } from "@/constants/theme";
import { ThemeDefinition } from "@/constants/ThemeColors";
import { Playlist } from "@/types";
import Song from "@/types";

const SEARCH_TAB_OPTIONS: TabOption<SearchType>[] = [
  { label: "Songs", value: "songs", icon: Music },
  { label: "Playlists", value: "playlists", icon: ListMusic },
];

/**
 * 検索画面（Search Screen）
 *
 * ユーザーが楽曲やプレイリストを検索できるメインインターフェースです。
 * ローカル履歴の表示、デバウンス検索、オンライン/オフライン状態のハンドリングを含みます。
 * ロジックは `useSearchScreen` カスタムフックにカプセル化されています。
 *
 * @returns {JSX.Element} 検索画面コンポーネント
 */
function SearchScreen() {
  const { isOnline } = useNetworkStatus();
  const colors = useThemeStore((state) => state.colors);

  const {
    rawQuery,
    controlledValue,
    searchType,
    songs,
    playlists,
    history,
    isLoading,
    error,
    showHistory,
    showEmptyState,
    setRawQuery,
    setDebouncedQuery,
    setSearchType,
    handleSongPress,
    handlePlaylistPress,
    handleHistorySelect,
    handleSubmit,
    removeQuery,
    clearHistory,
  } = useSearchScreen();

  const renderSongItem = useCallback(
    ({ item }: { item: Song }) => (
      <ListItem song={item} onPress={handleSongPress} />
    ),
    [handleSongPress],
  );

  const renderPlaylistItem = useCallback(
    ({ item }: { item: Playlist }) => (
      <PlaylistItem playlist={item} onPress={handlePlaylistPress} />
    ),
    [handlePlaylistPress],
  );

  const keyExtractor = useCallback((item: Song | Playlist) => item.id, []);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* ヘッダー */}
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Search</Text>
      </View>

      {/* 検索バー + タブ（常にマウント維持して入力値をキープ） */}
      <View style={styles.searchSection}>
        <SearchBar
          onDebouncedChange={setDebouncedQuery}
          onInputChange={setRawQuery}
          onSubmit={handleSubmit}
          controlledValue={controlledValue}
        />
        <TabSwitcher
          options={SEARCH_TAB_OPTIONS}
          value={searchType}
          onValueChange={setSearchType}
        />
      </View>

      {/* オフライン */}
      {!isOnline ? (
        <EmptyState
          icon={<CloudOff size={64} color={colors.subText} />}
          title="You are offline"
          subtitle="Search is only available when online"
          colors={colors}
        />
      ) : /* 検索前: 履歴表示 */
      showHistory ? (
        <View style={styles.historySection}>
          <SearchHistory
            history={history}
            onSelect={handleHistorySelect}
            onRemove={removeQuery}
            onClearAll={clearHistory}
          />
        </View>
      ) : /* ローディング中 */
      isLoading ? (
        <Loading
          variant="list"
          listProps={{ count: 6, showHeader: false, paddingHorizontal: 20 }}
        />
      ) : /* エラー */
      error ? (
        <Error message={error.message} />
      ) : /* 検索結果なし */
      showEmptyState ? (
        <EmptyState
          icon={<Search size={64} color={colors.subText} />}
          title="No results found"
          subtitle="Try adjusting your search terms"
          colors={colors}
        />
      ) : /* 検索結果 */
      searchType === "songs" ? (
        <FlashList
          key="songs-list"
          data={songs}
          keyExtractor={keyExtractor}
          renderItem={renderSongItem}
          estimatedItemSize={80}
          contentContainerStyle={styles.listContainer}
        />
      ) : (
        <FlashList
          key="playlists-list"
          data={playlists}
          keyExtractor={keyExtractor}
          renderItem={renderPlaylistItem}
          estimatedItemSize={250}
          numColumns={2}
          contentContainerStyle={{
            ...styles.listContainer,
            ...styles.playlistContainer,
          }}
        />
      )}
    </SafeAreaView>
  );
}

// --- Helper Components ---

// ----------------------------------------
// EmptyState (ローカル小コンポーネント)
// ----------------------------------------
interface EmptyStateProps {
  /** 表示するアイコン */
  icon: React.ReactNode;
  /** タイトルテキスト */
  title: string;
  /** サブタイトルテキスト */
  subtitle: string;
  /** テーマカラー定義 */
  colors: ThemeDefinition["colors"];
}

/**
 * 検索画面内の空状態（履歴なし、結果なし、オフライン）を表示するための内部コンポーネント
 */
function EmptyState({ icon, title, subtitle, colors }: EmptyStateProps) {
  return (
    <View style={styles.emptyContainer}>
      {icon}
      <Text style={[styles.emptyText, { color: colors.text }]}>{title}</Text>
      <Text style={[styles.emptySubText, { color: colors.subText }]}>
        {subtitle}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 34,
    fontFamily: FONTS.title,
    letterSpacing: 1,
  },
  searchSection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  historySection: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  playlistContainer: {
    paddingTop: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 20,
    fontFamily: FONTS.semibold,
    marginTop: 16,
  },
  emptySubText: {
    fontSize: 15,
    fontFamily: FONTS.body,
  },
});

export default memo(SearchScreen);
