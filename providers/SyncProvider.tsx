import React, { useEffect, createContext, useContext, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { useSyncSongs } from "@/hooks/sync/useSyncSongs";
import { useSyncLikedSongs } from "@/hooks/sync/useSyncLikedSongs";
import { useSyncPlaylists } from "@/hooks/sync/useSyncPlaylists";
import { useSyncTrendSongs } from "@/hooks/sync/useSyncTrendSongs";
import { useSyncRecommendations } from "@/hooks/sync/useSyncRecommendations";
import { useSyncSpotlights } from "@/hooks/sync/useSyncSpotlights";

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

  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
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

  // 同期完了時にタイムスタンプを更新
  useEffect(() => {
    if (!isSyncing && lastSyncTime === null && userId && isOnline) {
      // 初回同期が完了
      setLastSyncTime(new Date());
    }
  }, [isSyncing, lastSyncTime, userId, isOnline]);

  // 手動同期トリガー
  const triggerSync = () => {
    if (!isOnline) {
      return;
    }
    if (!userId) {
      return;
    }

    syncSongs();
    syncLiked();
    syncPlaylists();
    syncTrends();
    syncRecs();
    syncSpots();
  };

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
