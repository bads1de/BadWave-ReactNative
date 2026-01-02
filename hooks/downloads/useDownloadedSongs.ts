import { useQuery } from "@tanstack/react-query";
import { getOfflineStorageService } from "@/hooks/TrackPlayer/utils";
import { CACHED_QUERIES } from "@/constants";

/**
 * エラーオブジェクトを文字列メッセージに変換する
 * @param error - エラーオブジェクト
 * @returns エラーメッセージ文字列、またはnull
 */
function formatErrorMessage(error: unknown): string | null {
  if (!error) return null;
  return error instanceof Error ? error.message : String(error);
}

/**
 * ダウンロード済みの曲を取得するカスタムフック
 * @returns ダウンロード済みの曲一覧と状態
 */
export function useDownloadedSongs() {
  const {
    data: songs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: [CACHED_QUERIES.downloadedSongs],
    queryFn: async () => {
      try {
        const offlineStorageService = getOfflineStorageService();
        return await offlineStorageService.getDownloadedSongs();
      } catch (err) {
        console.error("Failed to fetch downloaded songs:", err);
        throw err;
      }
    },
    // ダウンロード済み曲リストは頻繁に変わる可能性があるので、staleTimeを短めに設定
    staleTime: 1000 * 30, // 30秒
  });

  return {
    songs,
    isLoading,
    error: formatErrorMessage(error),
    refresh: refetch,
  };
}
