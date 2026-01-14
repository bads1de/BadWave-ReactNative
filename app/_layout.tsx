import AuthModal from "@/components/modal/AuthModal";
import { ToastComponent } from "@/components/common/CustomToast";
import NetworkStatusBar from "@/components/common/NetworkStatusBar";
import TrackPlayer from "react-native-track-player";
import { playbackService } from "@/services/PlayerService";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AppInitializerProvider } from "@/providers/AppInitializerProvider";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";
import { SyncProvider } from "@/providers/SyncProvider";
import { useAuthStore } from "@/hooks/stores/useAuthStore";
import { Stack } from "expo-router";
import { View } from "react-native";
import { StatusBar } from "expo-status-bar";

// TrackPlayerのサービス登録用グローバル変数
declare global {
  var __TRACK_PLAYER_SERVICE_REGISTERED__: boolean | undefined;
}

// TrackPlayerのサービス登録
if (!global.__TRACK_PLAYER_SERVICE_REGISTERED__) {
  TrackPlayer.registerPlaybackService(playbackService);
  global.__TRACK_PLAYER_SERVICE_REGISTERED__ = true;
}

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

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          <SyncProvider>
            <AppInitializerProvider>
              <View style={{ flex: 1, backgroundColor: "#000" }}>
                <StatusBar style="light" />
                <NetworkStatusBar />
                {showAuthModal && <AuthModal />}
                <Stack screenOptions={{ headerShown: false }} />
                <ToastComponent />
              </View>
            </AppInitializerProvider>
          </SyncProvider>
        </AuthProvider>
      </QueryProvider>
    </GestureHandlerRootView>
  );
}
