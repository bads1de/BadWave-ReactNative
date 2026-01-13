import React, { ReactNode } from "react";
import { QueryClient, onlineManager } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { CACHE_CONFIG } from "@/constants";
import { mmkvPersister } from "@/lib/storage/mmkv-persister";

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
        // オンラインの場合、一時停止されたミューテーションを再開し、クエリを再取得
        if (onlineManager.isOnline()) {
          await queryClient.resumePausedMutations();
          await queryClient.invalidateQueries();
        }
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
