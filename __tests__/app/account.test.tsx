import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import AccountScreen from "@/app/(tabs)/account";
import { useSync } from "@/providers/SyncProvider";
import { useThemeStore } from "@/hooks/stores/useThemeStore";
import { useUser } from "@/actions/getUser";
import { useGetPlaylists } from "@/hooks/data/useGetPlaylists";
import { useGetLikedSongs } from "@/hooks/data/useGetLikedSongs";
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
    expect(getByText(/Last Synced:/)).toBeTruthy();

    const syncButton = getByText("Sync Now");
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
    expect(getByText("Syncing...")).toBeTruthy(); // This is the button text
  });
});
