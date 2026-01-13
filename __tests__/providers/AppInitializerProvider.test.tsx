import React from "react";
import { render, waitFor } from "@testing-library/react-native";
import { Text } from "react-native";
import { AppInitializerProvider } from "@/providers/AppInitializerProvider";
import { useMigrations } from "drizzle-orm/expo-sqlite/migrator";
import { setupPlayer } from "@/services/PlayerService";

// モック
jest.mock("drizzle-orm/expo-sqlite/migrator", () => ({
  useMigrations: jest.fn(),
}));

jest.mock("@/lib/db/client", () => ({
  db: {},
}));

jest.mock("@/drizzle/migrations", () => ({}));

jest.mock("@/services/PlayerService", () => ({
  setupPlayer: jest.fn(),
}));

describe("AppInitializerProvider", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("マイグレーション中およびプレイヤーセットアップ中は初期化画面を表示すること", () => {
    (useMigrations as jest.Mock).mockReturnValue({
      success: false,
      error: null,
    });
    (setupPlayer as jest.Mock).mockResolvedValue(false);

    const { getByText } = render(
      <AppInitializerProvider>
        <Text>Loaded</Text>
      </AppInitializerProvider>
    );

    expect(getByText("Initializing...")).toBeTruthy();
  });

  it("マイグレーションエラー時にエラー画面を表示すること", () => {
    (useMigrations as jest.Mock).mockReturnValue({
      success: false,
      error: new Error("Migration failed"),
    });

    const { getByText } = render(
      <AppInitializerProvider>
        <Text>Loaded</Text>
      </AppInitializerProvider>
    );

    expect(getByText("Database Error: Migration failed")).toBeTruthy();
  });

  it("初期化が完了したら子要素を表示すること", async () => {
    (useMigrations as jest.Mock).mockReturnValue({
      success: true,
      error: null,
    });
    (setupPlayer as jest.Mock).mockResolvedValue(true);

    const { getByText } = render(
      <AppInitializerProvider>
        <Text>Loaded</Text>
      </AppInitializerProvider>
    );

    await waitFor(() => {
      expect(getByText("Loaded")).toBeTruthy();
    });
  });
});
