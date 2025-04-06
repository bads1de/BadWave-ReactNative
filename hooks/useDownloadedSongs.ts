import { useQuery } from "@tanstack/react-query";
import Song from "../types";
import { getOfflineStorageService } from "./TrackPlayer/utils";
import { CACHED_QUERIES } from "@/constants";

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
    error: error
      ? error instanceof Error
        ? error.message
        : String(error)
      : null,
    refresh: refetch,
  };
}
