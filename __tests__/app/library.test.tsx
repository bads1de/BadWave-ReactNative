import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LibraryScreen from "@/app/(tabs)/library";

jest.mock("@/components/item/SongItem", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/item/PlaylistItem", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/common/Loading", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/common/Error", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/common/CustomButton", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/playlist/CreatePlaylist", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/hooks/useAudioPlayer", () => ({ useAudioPlayer: jest.fn() }));
jest.mock("@/hooks/stores/useAuthStore", () => ({ useAuthStore: jest.fn() }));
jest.mock("@/providers/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("expo-router", () => ({ useRouter: jest.fn() }));
jest.mock("@/hooks/data/useGetLikedSongs", () => ({
  useGetLikedSongs: jest.fn(() => ({
    likedSongs: [],
    isLoading: false,
    error: null,
  })),
}));
jest.mock("@/hooks/data/useGetPlaylists", () => ({
  useGetPlaylists: jest.fn(() => ({
    playlists: [],
    isLoading: false,
    error: null,
  })),
}));

const { useAudioPlayer } = require("@/hooks/useAudioPlayer");
const { useAuth } = require("@/providers/AuthProvider");
const { useAuthStore } = require("@/hooks/stores/useAuthStore");
const { useRouter } = require("expo-router");

describe("LibraryScreen", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useAudioPlayer.mockReturnValue({
      togglePlayPause: jest.fn(),
      currentSong: null,
    });
    useAuth.mockReturnValue({ session: null, setSession: jest.fn() });
    useAuthStore.mockReturnValue({ setShowAuthModal: jest.fn() });
    useRouter.mockReturnValue({ push: jest.fn() });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(<LibraryScreen />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });
});

