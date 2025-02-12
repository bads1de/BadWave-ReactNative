import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { CACHE_CONFIG, CACHED_QUERIES, CACHE_PREFIX } from "@/constants";
import { QueryPersistenceManager } from "@/lib/query-persistence-manager";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_CONFIG.staleTime,
      gcTime: CACHE_CONFIG.gcTime,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
    },
  },
});

const persistenceManager = new QueryPersistenceManager(queryClient);

// キャッシュの監視と保存
queryClient.getQueryCache().subscribe(async (event) => {
  if (event?.query.state.data) {
    const queryKey = event.query.queryKey[0] as keyof typeof CACHED_QUERIES;
    if (Object.values(CACHED_QUERIES).includes(queryKey)) {
      await persistenceManager.saveCache(queryKey, event.query.state.data);
    }
  }
});

// 初期ロード時にキャッシュを復元
persistenceManager.initializeCache(Object.values(CACHED_QUERIES));

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <View style={{ flex: 1, backgroundColor: "#000" }}>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </View>
    </QueryClientProvider>
  );
}
