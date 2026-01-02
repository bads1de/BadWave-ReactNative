import { useState, useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getOfflineStorageService } from "@/hooks/TrackPlayer/utils";
import { CACHED_QUERIES } from "@/constants";
import Song from "@/types";

export type BulkDownloadStatus = "none" | "partial" | "all";

export interface BulkDownloadProgress {
  current: number;
  total: number;
}

export interface UseBulkDownloadResult {
  /** ダウンロード状態: 'none' = 未ダウンロード, 'partial' = 一部, 'all' = 全曲 */
  status: BulkDownloadStatus;
  /** ダウンロード済み曲数 */
  downloadedCount: number;
  /** 総曲数 */
  totalCount: number;
  /** ダウンロード中かどうか */
  isDownloading: boolean;
  /** ダウンロード進捗 */
  progress: BulkDownloadProgress;
  /** エラーメッセージ */
  error: string | null;
  /** ダウンロード開始 */
  startDownload: () => Promise<void>;
  /** 削除開始 */
  startDelete: () => Promise<void>;
  /** キャンセル */
  cancel: () => void;
  /** 状態を再チェック */
  refresh: () => Promise<void>;
}

/**
 * 一括ダウンロード/削除機能を提供するフック
 * @param songs 対象の曲リスト
 * @returns 一括ダウンロード操作用の状態と関数
 */
export function useBulkDownload(songs: Song[]): UseBulkDownloadResult {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<BulkDownloadStatus>("none");
  const [downloadedCount, setDownloadedCount] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<BulkDownloadProgress>({
    current: 0,
    total: 0,
  });
  const [error, setError] = useState<string | null>(null);

  // キャンセル用のフラグ
  const cancelledRef = useRef(false);
  const isCheckingRef = useRef(false);

  const totalCount = songs.length;

  /**
   * 各曲のダウンロード状態をチェックして status を更新
   */
  const checkDownloadStatus = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    try {
      if (songs.length === 0) {
        setStatus("all");
        setDownloadedCount(0);
        isCheckingRef.current = false;
        return;
      }

      const offlineService = getOfflineStorageService();
      let count = 0;

      for (const song of songs) {
        const isDownloaded = await offlineService.isSongDownloaded(song.id);
        if (isDownloaded) {
          count++;
        }
      }

      setDownloadedCount(count);

      if (count === 0) {
        setStatus("none");
      } else if (count === songs.length) {
        setStatus("all");
      } else {
        setStatus("partial");
      }
    } catch (err) {
      console.error("Failed to check download status:", err);
    } finally {
      isCheckingRef.current = false;
    }
  }, [songs]);

  // 初回とsongs変更時にステータスをチェック
  useEffect(() => {
    checkDownloadStatus();
  }, [checkDownloadStatus]);

  /**
   * 未ダウンロード曲をダウンロード
   */
  const startDownload = useCallback(async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    setError(null);
    cancelledRef.current = false;

    const offlineService = getOfflineStorageService();
    const songsToDownload: Song[] = [];

    // 未ダウンロードの曲を特定
    for (const song of songs) {
      const isDownloaded = await offlineService.isSongDownloaded(song.id);
      if (!isDownloaded) {
        songsToDownload.push(song);
      }
    }

    setProgress({ current: 0, total: songsToDownload.length });

    let _successCount = 0;
    let failCount = 0;

    for (let i = 0; i < songsToDownload.length; i++) {
      if (cancelledRef.current) {
        break;
      }

      const song = songsToDownload[i];
      const result = await offlineService.downloadSong(song);

      if (result.success) {
        _successCount++;
      } else {
        failCount++;
      }

      setProgress({ current: i + 1, total: songsToDownload.length });
    }

    if (failCount > 0 && !cancelledRef.current) {
      setError("一部の曲のダウンロードに失敗しました");
    }

    // キャッシュを無効化
    queryClient.invalidateQueries({
      queryKey: [CACHED_QUERIES.downloadedSongs],
    });

    // ダウンロード状態を再チェック
    await checkDownloadStatus();

    setIsDownloading(false);
  }, [songs, isDownloading, queryClient, checkDownloadStatus]);

  /**
   * ダウンロード済み曲を全て削除
   */
  const startDelete = useCallback(async () => {
    if (isDownloading) return;

    setIsDownloading(true);
    setError(null);
    cancelledRef.current = false;

    const offlineService = getOfflineStorageService();
    setProgress({ current: 0, total: songs.length });

    let failCount = 0;

    for (let i = 0; i < songs.length; i++) {
      if (cancelledRef.current) {
        break;
      }

      const song = songs[i];
      const result = await offlineService.deleteSong(song.id);

      if (!result.success) {
        failCount++;
      }

      setProgress({ current: i + 1, total: songs.length });
    }

    if (failCount > 0 && !cancelledRef.current) {
      setError("一部の曲の削除に失敗しました");
    }

    // キャッシュを無効化
    queryClient.invalidateQueries({
      queryKey: [CACHED_QUERIES.downloadedSongs],
    });

    // ダウンロード状態を再チェック
    await checkDownloadStatus();

    setIsDownloading(false);
  }, [songs, isDownloading, queryClient, checkDownloadStatus]);

  /**
   * ダウンロード/削除をキャンセル
   */
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setIsDownloading(false);
  }, []);

  /**
   * 状態を再チェック
   */
  const refresh = useCallback(async () => {
    await checkDownloadStatus();
  }, [checkDownloadStatus]);

  return {
    status,
    downloadedCount,
    totalCount,
    isDownloading,
    progress,
    error,
    startDownload,
    startDelete,
    cancel,
    refresh,
  };
}
