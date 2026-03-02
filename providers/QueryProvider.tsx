import React, { ReactNode } from "react";
import { QueryClient, onlineManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { CACHE_CONFIG } from "@/constants";
import { mmkvPersister } from "@/lib/storage/mmkv-persister";
import { QueryPersistenceManager } from "@/lib/storage/query-persistence-manager";
import { expoDb } from "@/lib/db/client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_CONFIG.staleTime,
      gcTime: CACHE_CONFIG.gcTime,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

/**
 * React Query (TanStack Query) の設定と永続化を管理するプロバイダー
 */
export function QueryProvider({ children }: QueryProviderProps) {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: mmkvPersister,
        maxAge: 1000 * 60 * 60 * 24, // 24時間
      }}
      // キャッシュが復元された後の処理
      onSuccess={async () => {
        // バックグラウンドでのストレージ最適化処理
        setTimeout(async () => {
          try {
            // 1. MMKVの期限切れキャッシュ削除 (クリーンアップ)
            const persistenceManager = new QueryPersistenceManager(queryClient);
            persistenceManager.cleanUpOldCache();

            // 2. SQLite の断片化解消 (VACUUM)
            await expoDb.execAsync("VACUUM;");
            console.log("[Storage Optimization]: SQLite VACUUM completed.");
          } catch (e) {
            console.error("[Storage Optimization Failed]:", e);
          }
        }, 5000); // 起動直後の負荷を避けるため5秒遅延させる

        // オンラインの場合、一時停止されたミューテーションを再開
        if (onlineManager.isOnline()) {
          await queryClient.resumePausedMutations();
        }
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
