import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getOfflineStorageService } from "@/hooks/TrackPlayer/utils";
import { CACHED_QUERIES } from "@/constants";
import Song from "@/types";

/**
 * 曲のダウンロード状態を取得するカスタムフック
 * @param songId 曲のID
 * @returns ダウンロード状態のクエリ結果
 */
export function useDownloadStatus(songId: string) {
  return useQuery({
    queryKey: [CACHED_QUERIES.downloadStatus, songId],
    queryFn: async () => {
      const offlineStorageService = getOfflineStorageService();
      return offlineStorageService.isSongDownloaded(songId);
    },
    // ダウンロード状態は頻繁に変わらないので、staleTimeを長めに設定
    staleTime: 1000 * 60 * 5, // 5分
  });
}

/**
 * 曲をダウンロードするためのミューテーションフック
 * @returns ダウンロードミューテーション
 */
export function useDownloadSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [CACHED_QUERIES.downloadStatus, "download"],
    mutationFn: async (song: Song) => {
      const offlineStorageService = getOfflineStorageService();
      return offlineStorageService.downloadSong(song);
    },
    onSuccess: (result, song) => {
      if (result.success) {
        // ダウンロード状態のキャッシュを更新
        queryClient.setQueryData(
          [CACHED_QUERIES.downloadStatus, song.id],
          true
        );
        // ダウンロード済み曲リストを無効化して再取得を促す
        queryClient.invalidateQueries({
          queryKey: [CACHED_QUERIES.downloadedSongs],
        });
        // ストレージサイズも更新
        queryClient.invalidateQueries({
          queryKey: ["storageSize"],
        });
      }
    },
  });
}

/**
 * ダウンロードした曲を削除するためのミューテーションフック
 * @returns 削除ミューテーション
 */
export function useDeleteDownloadedSong() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: [CACHED_QUERIES.downloadStatus, "delete"],
    mutationFn: async (songId: string) => {
      const offlineStorageService = getOfflineStorageService();
      return offlineStorageService.deleteSong(songId);
    },
    onSuccess: (result, songId) => {
      if (result.success) {
        // ダウンロード状態のキャッシュを更新
        queryClient.setQueryData(
          [CACHED_QUERIES.downloadStatus, songId],
          false
        );
        // ダウンロード済み曲リストを無効化して再取得を促す
        queryClient.invalidateQueries({
          queryKey: [CACHED_QUERIES.downloadedSongs],
        });
        // ストレージサイズも更新
        queryClient.invalidateQueries({
          queryKey: ["storageSize"],
        });
      }
    },
  });
}
