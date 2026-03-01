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
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { useNetworkStore } from "@/hooks/stores/useNetworkStore";
import {
  useFonts,
  BodoniModa_400Regular,
  BodoniModa_700Bold,
} from "@expo-google-fonts/bodoni-moda";
import {
  Jost_400Regular,
  Jost_600SemiBold,
  Jost_700Bold,
} from "@expo-google-fonts/jost";
import { COLORS } from "@/constants/theme";

// スプラッシュ画面を維持
SplashScreen.preventAutoHideAsync();

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
 */
export default function RootLayout() {
  const showAuthModal = useAuthStore((state) => state.showAuthModal);

  const [loaded, error] = useFonts({
    BodoniModa_400Regular,
    BodoniModa_700Bold,
    Jost_400Regular,
    Jost_600SemiBold,
    Jost_700Bold,
  });

  const initNetwork = useNetworkStore((state) => state._init);

  useEffect(() => {
    const unsubscribe = initNetwork();
    return () => unsubscribe();
  }, [initNetwork]);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  if (!loaded && !error) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryProvider>
        <AuthProvider>
          <SyncProvider>
            <AppInitializerProvider>
              <View style={{ flex: 1, backgroundColor: COLORS.background }}>
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
