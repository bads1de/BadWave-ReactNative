import React, { useEffect, createContext, useContext, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSyncSongs } from "@/hooks/sync/useSyncSongs";
import { useSyncLikedSongs } from "@/hooks/sync/useSyncLikedSongs";
import { useSyncPlaylists } from "@/hooks/sync/useSyncPlaylists";
import { useSyncTrendSongs } from "@/hooks/sync/useSyncTrendSongs";
import { useSyncRecommendations } from "@/hooks/sync/useSyncRecommendations";
import { useSyncSpotlights } from "@/hooks/sync/useSyncSpotlights";
import { storage } from "@/lib/mmkv-storage";
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
  const triggerSync = async () => {
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
  };

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
    if (isOnline && userId) {
      // 同期フックは enabled: !!userId で自動的に実行される
    }
  }, [isOnline, userId]);

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
