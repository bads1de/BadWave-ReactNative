import React, { useEffect, useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { onlineManager } from "@tanstack/react-query";
import { Stack } from "expo-router";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";
import { CACHE_CONFIG } from "@/constants";
import { mmkvPersister } from "@/lib/mmkv-persister";
import { AuthProvider } from "@/providers/AuthProvider";
import { useAuthStore } from "@/hooks/useAuthStore";
import AuthModal from "@/components/modal/AuthModal";
import { ToastComponent } from "@/components/common/CustomToast";
import TrackPlayer from "react-native-track-player";
import { playbackService, setupPlayer } from "@/services/PlayerService";
import { GestureHandlerRootView } from "react-native-gesture-handler";

declare global {
  // eslint-disable-next-line no-var
  var __TRACK_PLAYER_SERVICE_REGISTERED__: boolean | undefined;
}

if (!global.__TRACK_PLAYER_SERVICE_REGISTERED__) {
  TrackPlayer.registerPlaybackService(playbackService);
  global.__TRACK_PLAYER_SERVICE_REGISTERED__ = true;
}

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

/**
 * @file _layout.tsx
 * @description アプリケーションのルートレイアウトコンポーネントです。
 *
 * このコンポーネントは、アプリケーション全体で利用される以下の機能を提供・設定します。
 * - React Query (TanStack Query) とキャッシュの永続化設定 (`PersistQueryClientProvider`)
 * - 認証状態のグローバル管理 (`AuthProvider`)
 * - ジェスチャーハンドリング (`GestureHandlerRootView`)
 * - グローバルな認証モーダルとトースト通知コンポーネントの配置
 * - `react-native-track-player` のサービス登録とプレイヤーの初期セットアップ
 * - ヘッダーを非表示にするための `Stack` のデフォルト設定
 */
export default function RootLayout() {
  const showAuthModal = useAuthStore((state) => state.showAuthModal);
  const [isPlayerReady, setIsPlayerReady] = useState(false);

  useEffect(() => {
    // プレイヤーのセットアップ
    const setupPlayerAsync = async () => {
      if (isPlayerReady) return;

      try {
        const isSetup = await setupPlayer();
        setIsPlayerReady(isSetup);
      } catch (error) {
        console.error(
          "プレイヤーのセットアップ中にエラーが発生しました:",
          error
        );
      }
    };

    setupPlayerAsync();
  }, [isPlayerReady]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
        <AuthProvider>
          <View style={{ flex: 1, backgroundColor: "#000" }}>
            <StatusBar style="light" />
            {showAuthModal && <AuthModal />}
            <Stack screenOptions={{ headerShown: false }} />
            <ToastComponent />
          </View>
        </AuthProvider>
      </PersistQueryClientProvider>
    </GestureHandlerRootView>
  );
}
