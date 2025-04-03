import { useState, useEffect, useCallback } from "react";
import Song from "../types";
import { getOfflineStorageService } from "./TrackPlayer/utils";

/**
 * ダウンロード済みの曲を取得するカスタムフック
 * @returns ダウンロード済みの曲一覧と状態
 */
export function useDownloadedSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * ダウンロード済みの曲を取得する
   */
  const fetchDownloadedSongs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const offlineStorageService = getOfflineStorageService();
      const downloadedSongs = await offlineStorageService.getDownloadedSongs();

      setSongs(downloadedSongs);
    } catch (err) {
      console.error("Failed to fetch downloaded songs:", err);
      setError(err instanceof Error ? err.message : String(err));
      setSongs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 曲一覧を更新する
   */
  const refresh = useCallback(() => {
    fetchDownloadedSongs();
  }, [fetchDownloadedSongs]);

  // 初回マウント時に曲一覧を取得
  useEffect(() => {
    fetchDownloadedSongs();
  }, [fetchDownloadedSongs]);

  return {
    songs,
    isLoading,
    error,
    refresh,
  };
}
