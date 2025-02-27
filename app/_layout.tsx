import React, { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { QueryPersistenceManager } from "@/lib/query-persistence-manager";
import { AuthProvider } from "@/providers/AuthProvider";
import { useAuthStore } from "@/hooks/useAuthStore";
import AuthModal from "@/components/AuthModal";
import { ToastComponent } from "@/components/CustomToast";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

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
  const { showAuthModal } = useAuthStore();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <View style={{ flex: 1, backgroundColor: "#000" }}>
            <StatusBar style="light" />
            {showAuthModal && <AuthModal />}
            <Stack screenOptions={{ headerShown: false }} />
            <ToastComponent />
          </View>
        </AuthProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
