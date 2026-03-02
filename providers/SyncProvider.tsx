import React, {
  useEffect,
  createContext,
  useContext,
  useState,
  useCallback,
} from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useSyncSongs } from "@/hooks/sync/useSyncSongs";
import { useSyncLikedSongs } from "@/hooks/sync/useSyncLikedSongs";
import { useSyncPlaylists } from "@/hooks/sync/useSyncPlaylists";
import { useSyncTrendSongs } from "@/hooks/sync/useSyncTrendSongs";
import { useSyncRecommendations } from "@/hooks/sync/useSyncRecommendations";
import { useSyncSpotlights } from "@/hooks/sync/useSyncSpotlights";
import { storage } from "@/lib/storage/mmkv-storage";
import { SYNC_STORAGE_KEY } from "@/constants";

interface SyncContextValue {
  isSyncing: boolean;
  lastSyncTime: Date | null;
  triggerSync: () => void;
  syncError: Error | null;
}

const SyncContext = createContext<SyncContextValue | undefined>(undefined);

/**
 * 同期状態を管理するプロバイダー
 * 認証済みユーザーに対して自動的に Supabase -> SQLite の同期を開始
 */
export function SyncProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const { isOnline } = useNetworkStatus();
  const userId = session?.user?.id;

  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(() => {
    const saved = storage.getString(SYNC_STORAGE_KEY);
    return saved ? new Date(saved) : null;
  });
  const [syncError, setSyncError] = useState<Error | null>(null);

  // 各同期フック
  const {
    isSyncing: isSyncingSongs,
    syncError: songsError,
    triggerSync: syncSongs,
  } = useSyncSongs();

  const {
    isSyncing: isSyncingLiked,
    syncError: likedError,
    triggerSync: syncLiked,
  } = useSyncLikedSongs(userId);

  const {
    isSyncing: isSyncingPlaylists,
    syncError: playlistsError,
    triggerSync: syncPlaylists,
  } = useSyncPlaylists(userId);

  // ホームセクション用同期
  const {
    isSyncing: isSyncingTrends,
    triggerSync: syncTrends,
    syncError: trendsError,
  } = useSyncTrendSongs();
  const {
    isSyncing: isSyncingRecs,
    triggerSync: syncRecs,
    syncError: recsError,
  } = useSyncRecommendations(userId);
  const {
    isSyncing: isSyncingSpots,
    triggerSync: syncSpots,
    syncError: spotsError,
  } = useSyncSpotlights();

  // 全体の同期状態
  const isSyncing =
    isSyncingSongs ||
    isSyncingLiked ||
    isSyncingPlaylists ||
    isSyncingTrends ||
    isSyncingRecs ||
    isSyncingSpots;

  // エラー集約
  useEffect(() => {
    const error =
      songsError ||
      likedError ||
      playlistsError ||
      trendsError ||
      recsError ||
      spotsError;
    if (error) {
      setSyncError(error as Error);
    }
  }, [
    songsError,
    likedError,
    playlistsError,
    trendsError,
    recsError,
    spotsError,
  ]);

  // 手動同期トリガー
  const triggerSync = useCallback(async () => {
    if (!isOnline || !userId || isSyncing) {
      return;
    }

    const startTime = Date.now();

    // 全ての同期を開始
    await Promise.all([
      syncSongs(),
      syncLiked(),
      syncPlaylists(),
      syncTrends(),
      syncRecs(),
      syncSpots(),
    ]);

    // 最低1秒間は同期中を表示し続ける（視覚的フィードバックのため）
    const duration = Date.now() - startTime;
    if (duration < 1000) {
      await new Promise((resolve) => setTimeout(resolve, 1000 - duration));
    }
  }, [
    isOnline,
    userId,
    isSyncing,
    syncSongs,
    syncLiked,
    syncPlaylists,
    syncTrends,
    syncRecs,
    syncSpots,
  ]);

  // 同期ステータスを監視して、同期完了時に更新
  const prevIsSyncing = React.useRef(isSyncing);

  useEffect(() => {
    if (prevIsSyncing.current && !isSyncing && !syncError && userId) {
      const now = new Date();
      setLastSyncTime(now);
      storage.set(SYNC_STORAGE_KEY, now.toISOString());
    }
    prevIsSyncing.current = isSyncing;
  }, [isSyncing, syncError, userId]);

  // 初回マウント時に同期を開始（オンライン & 認証済みの場合）
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    // 初回同期用の関数。優先度をつけて段階的に同期を行う。
    // ※ manual_sync（ユーザーが手動で更新引っ張る場合）は今まで通り triggerSync() で一括ですが、
    // ここでは初期バックグラウンド同期を制御します。
    const runInitialSync = async () => {
      // コアデータ (ユーザーのライブラリ) は即座に同期を開始
      const coreSyncs = [syncSongs(), syncLiked(), syncPlaylists()];
      await Promise.allSettled(coreSyncs);

      // 初期描画が落ち着くまで少し時間をおく (例: 3秒)
      timeoutId = setTimeout(async () => {
        if (!isOnline || !userId) return;
        // 周辺データ (トレンド、おすすめ、スポットライト) の同期を開始
        const secondarySyncs = [syncTrends(), syncRecs(), syncSpots()];
        await Promise.allSettled(secondarySyncs);
      }, 3000);
    };

    if (isOnline && userId) {
      runInitialSync();
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [
    isOnline,
    userId,
    syncSongs,
    syncLiked,
    syncPlaylists,
    syncTrends,
    syncRecs,
    syncSpots,
  ]);

  const value: SyncContextValue = {
    isSyncing,
    lastSyncTime,
    triggerSync,
    syncError,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

/**
 * 同期状態を取得するフック
 */
export function useSync() {
  const context = useContext(SyncContext);
  if (context === undefined) {
    throw new Error("useSync must be used within a SyncProvider");
  }
  return context;
}

export default SyncProvider;
