import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import getSongsByTitle from "@/actions/song/getSongsByTitle";
import getPlaylistsByTitle from "@/actions/playlist/getPlaylistsByTitle";
import { usePlayControls } from "@/hooks/audio/useAudioPlayer";
import { useSearchHistoryStore } from "@/hooks/stores/useSearchHistoryStore";
import { CACHED_QUERIES } from "@/constants";
import { Playlist } from "@/types";
import Song from "@/types";

export type SearchType = "songs" | "playlists";

/**
 * 検索画面のビジネスロジックをまとめたカスタムフック。
 *
 * - debouncedQuery: Supabase へのクエリ用（300ms後に更新）
 * - rawQuery: 履歴の表示/非表示の即時判定用
 * - controlledValue: SearchBar に外部から値を注入する場合（履歴選択時）
 */
export function useSearchScreen() {
  const router = useRouter();

  // --- クエリ状態 ---
  // rawQuery: キー入力のたびに即時更新（履歴表示の制御に使う）
  const [rawQuery, setRawQuery] = useState("");
  // debouncedQuery: 実際の検索に使う（SearchBar 内でデバウンスされた値）
  const [debouncedQuery, setDebouncedQuery] = useState("");
  // controlledValue: 履歴から選択したとき SearchBar に値を渡す
  const [controlledValue, setControlledValue] = useState<string | undefined>();
  const [searchType, setSearchType] = useState<SearchType>("songs");

  // --- 検索履歴 ---
  const history = useSearchHistoryStore((state) => state.history);
  const addQuery = useSearchHistoryStore((state) => state.addQuery);
  const removeQuery = useSearchHistoryStore((state) => state.removeQuery);
  const clearHistory = useSearchHistoryStore((state) => state.clearHistory);
  const loadHistory = useSearchHistoryStore((state) => state.loadHistory);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // --- Supabase 検索クエリ ---
  const {
    data: songs = [],
    isLoading: isSongsLoading,
    error: songsError,
  } = useQuery({
    queryKey: [CACHED_QUERIES.songs, CACHED_QUERIES.search, debouncedQuery],
    queryFn: () => getSongsByTitle(debouncedQuery),
    enabled: debouncedQuery.length > 0 && searchType === "songs",
    staleTime: 0, // 常に最新結果を取得（グローバルの 10 分設定を上書き）
  });

  const {
    data: playlists = [],
    isLoading: isPlaylistsLoading,
    error: playlistsError,
  } = useQuery({
    queryKey: [CACHED_QUERIES.playlists, CACHED_QUERIES.search, debouncedQuery],
    queryFn: () => getPlaylistsByTitle(debouncedQuery),
    enabled: debouncedQuery.length > 0 && searchType === "playlists",
    staleTime: 0,
  });

  // キーボードの Search ボタンを押した時に履歴へ追加する
  // デバウンス後に自動追加しないことで「一文字毎に履歴が贰まる」問題を防ぐ
  const handleSubmit = useCallback(() => {
    if (debouncedQuery.length > 0) {
      addQuery(debouncedQuery);
    }
  }, [debouncedQuery, addQuery]);

  // --- オーディオ ---
  const { togglePlayPause } = usePlayControls(songs, "search");

  // --- ハンドラ ---
  const handleSongPress = useCallback(
    (song: Song) => togglePlayPause(song),
    [togglePlayPause],
  );

  const handlePlaylistPress = useCallback(
    (playlist: Playlist) => router.push(`/playlist/${playlist.id}`),
    [router],
  );

  const handleHistorySelect = useCallback((query: string) => {
    setRawQuery(query);
    setDebouncedQuery(query);
    setControlledValue(query);
  }, []);

  // --- 表示状態の計算 ---
  const isLoading =
    searchType === "songs" ? isSongsLoading : isPlaylistsLoading;
  const error = searchType === "songs" ? songsError : playlistsError;
  const currentData = searchType === "songs" ? songs : playlists;
  const hasResults = currentData.length > 0;
  const showHistory = rawQuery.length === 0 && history.length > 0;
  const showEmptyState = debouncedQuery.length > 0 && !hasResults && !isLoading;

  return {
    // 状態
    rawQuery,
    debouncedQuery,
    controlledValue,
    searchType,
    // データ
    songs,
    playlists,
    history,
    // 表示フラグ
    isLoading,
    error,
    showHistory,
    showEmptyState,
    // ハンドラ
    setRawQuery,
    setDebouncedQuery,
    setSearchType,
    handleSongPress,
    handlePlaylistPress,
    handleHistorySelect,
    handleSubmit,
    removeQuery,
    clearHistory,
  };
}
