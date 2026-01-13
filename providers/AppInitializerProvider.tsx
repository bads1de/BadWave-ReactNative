import React, { useEffect, useState, ReactNode } from "react";
import { View, Text, ActivityIndicator, StyleSheet } from "react-native";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { db } from "@/lib/db/client";
import migrations from "@/drizzle/migrations";
import { setupPlayer } from "@/services/PlayerService";

interface AppInitializerProviderProps {
  children: ReactNode;
}

/**
 * アプリケーションの初期化（DBマイグレーションとプレイヤーセットアップ）を管理するプロバイダー
 */
export function AppInitializerProvider({
  children,
}: AppInitializerProviderProps) {
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const { success: isMigrated, error: migrationError } = useMigrations(
    db,
    migrations
  );

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

  // マイグレーションエラー時
  if (migrationError) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>
          Database Error: {migrationError.message}
        </Text>
      </View>
    );
  }

  // マイグレーション実行中 または プレイヤー準備中
  if (!isMigrated || !isPlayerReady) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#7C3AED" />
        <Text style={styles.loadingText}>Initializing...</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#ff4444",
    fontSize: 16,
    textAlign: "center",
    padding: 20,
  },
  loadingText: {
    color: "#fff",
    marginTop: 16,
  },
});

