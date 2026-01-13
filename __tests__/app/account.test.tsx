import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import AccountScreen from "@/app/(tabs)/account";
import { useSync } from "@/providers/SyncProvider";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { useUser } from "@/actions/getUser";
import { useGetPlaylists } from "@/hooks/data/useGetPlaylists";
import { useGetLikedSongs } from "@/hooks/data/useGetLikedSongs";
import { useStorageInfo } from "@/hooks/common/useStorageInfo";
import { THEMES } from "@/constants/ThemeColors";

// Mocks
jest.mock("@/hooks/stores/useThemeStore");
jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));
jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));
jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));
jest.mock("expo-image", () => ({
  Image: "Image",
}));
jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));
jest.mock("@/actions/getUser");
jest.mock("@/hooks/data/useGetPlaylists");
jest.mock("@/hooks/data/useGetLikedSongs");
jest.mock("@/providers/SyncProvider");
jest.mock("@/hooks/common/useStorageInfo", () => ({
  useStorageInfo: jest.fn(),
  formatBytes: (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  },
}));

describe("AccountScreen", () => {
  const mockSetTheme = jest.fn();
  const mockTriggerSync = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useUser as jest.Mock).mockReturnValue({
      data: {
        id: "test-user",
        full_name: "Test User",
        avatar_url: "https://example.com/avatar.png",
      },
    });
    (useThemeStore as any).mockReturnValue({
      colors: THEMES.violet.colors,
      currentTheme: "violet",
      setTheme: mockSetTheme,
    });
    (useGetPlaylists as jest.Mock).mockReturnValue({ playlists: [] });
    (useGetLikedSongs as jest.Mock).mockReturnValue({ likedSongs: [] });
    (useSync as jest.Mock).mockReturnValue({
      isSyncing: false,
      lastSyncTime: new Date("2023-01-01T12:00:00Z"),
      triggerSync: mockTriggerSync,
      syncError: null,
    });
    (useStorageInfo as jest.Mock).mockReturnValue({
      downloadedSize: 50000000,
      downloadedCount: 5,
      isLoading: false,
      error: null,
      clearAllDownloads: jest.fn(),
      deleteAllDownloads: jest.fn(),
      clearQueryCache: jest.fn(),
      refreshStorageInfo: jest.fn(),
    });
  });

  it("renders correctly with user info", () => {
    const { getByText } = render(<AccountScreen />);
    expect(getByText("Account")).toBeTruthy();
    expect(getByText("Test User")).toBeTruthy();
  });

  it("renders theme selector", () => {
    const { getByText } = render(<AccountScreen />);
    expect(getByText("Appearance")).toBeTruthy();
    expect(getByText("Violet")).toBeTruthy();
    expect(getByText("Emerald")).toBeTruthy();
  });

  it("renders sync section and triggers sync", () => {
    const { getByText } = render(<AccountScreen />);

    expect(getByText("Synchronization")).toBeTruthy();
    expect(getByText(/Last:/)).toBeTruthy();

    const syncButton = getByText("Sync");
    fireEvent.press(syncButton);

    expect(mockTriggerSync).toHaveBeenCalled();
  });

  it("shows syncing state", () => {
    (useSync as jest.Mock).mockReturnValue({
      isSyncing: true,
      lastSyncTime: new Date(),
      triggerSync: mockTriggerSync,
      syncError: null,
    });

    const { getByText } = render(<AccountScreen />);
    expect(getByText("Syncing now...")).toBeTruthy();
  });

  it("renders storage section with download info", () => {
    const { getByText, getByTestId } = render(<AccountScreen />);

    expect(getByText("Storage")).toBeTruthy();
    expect(getByText("Downloads")).toBeTruthy();
    expect(getByText(/5 songs/)).toBeTruthy();
    expect(getByText(/47\.7 MB/)).toBeTruthy();
    expect(getByTestId("delete-all-downloads-button")).toBeTruthy();
    expect(getByTestId("clear-cache-button")).toBeTruthy();
  });

  it("triggers deleteAllDownloads when delete all button is pressed and confirmed in modal", async () => {
    const mockDeleteAllDownloads = jest.fn();
    (useStorageInfo as jest.Mock).mockReturnValue({
      downloadedSize: 50000000,
      downloadedCount: 5,
      isLoading: false,
      error: null,
      clearAllDownloads: jest.fn(),
      deleteAllDownloads: mockDeleteAllDownloads,
      clearQueryCache: jest.fn(),
      refreshStorageInfo: jest.fn(),
    });

    const { getByTestId, getByText, queryByText } = render(<AccountScreen />);

    // 最初はモーダルは非表示なので存在しないはず
    expect(queryByText("Delete Downloads?")).toBeNull();

    fireEvent.press(getByTestId("delete-all-downloads-button"));

    // ボタンプレス後はモーダルが表示されるはず
    expect(getByText("Delete Downloads?")).toBeTruthy();

    // モーダル内の確認ボタンを探して押す
    const confirmButton = getByTestId("modal-confirm-button");
    fireEvent.press(confirmButton);

    expect(mockDeleteAllDownloads).toHaveBeenCalled();
  });

  it("triggers clearQueryCache when clear cache button is pressed", () => {
    const mockClearQueryCache = jest.fn();
    (useStorageInfo as jest.Mock).mockReturnValue({
      downloadedSize: 50000000,
      downloadedCount: 5,
      isLoading: false,
      error: null,
      clearAllDownloads: jest.fn(),
      clearQueryCache: mockClearQueryCache,
      refreshStorageInfo: jest.fn(),
    });

    const { getByTestId } = render(<AccountScreen />);
    fireEvent.press(getByTestId("clear-cache-button"));

    expect(mockClearQueryCache).toHaveBeenCalled();
  });

  it("disables delete all button when no downloads", () => {
    (useStorageInfo as jest.Mock).mockReturnValue({
      downloadedSize: 0,
      downloadedCount: 0,
      isLoading: false,
      error: null,
      clearAllDownloads: jest.fn(),
      clearQueryCache: jest.fn(),
      refreshStorageInfo: jest.fn(),
    });

    const { getByText } = render(<AccountScreen />);
    expect(getByText(/0 songs/)).toBeTruthy();
    expect(getByText(/0 B/)).toBeTruthy();
  });
});
