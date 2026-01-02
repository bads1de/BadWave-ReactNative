import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PlaylistDetailScreen from "@/app/(tabs)/playlist/[playlistId]";

jest.mock("@/components/item/ListItem", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/common/Loading", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/common/Error", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/playlist/PlaylistOptionsMenu", () => ({ __esModule: true, default: () => null }));
jest.mock("@/hooks/useAudioPlayer", () => ({ useAudioPlayer: jest.fn() }));
jest.mock("@/hooks/stores/useHeaderStore", () => ({ useHeaderStore: jest.fn() }));
jest.mock("@/providers/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("expo-image", () => ({ Image: "Image" }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("expo-blur", () => ({ BlurView: "BlurView" }));
jest.mock("react-native-toast-message", () => ({ __esModule: true, default: { show: jest.fn() } }));
jest.mock("react-native-safe-area-context", () => ({ SafeAreaView: "SafeAreaView" }));
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useFocusEffect: jest.fn((fn) => fn()),
  useLocalSearchParams: jest.fn(),
}));
jest.mock("@/actions/getPlaylistSongs", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("@/actions/getPlaylistById", () => ({ __esModule: true, default: jest.fn() }));
jest.mock("@/actions/deletePlaylistSong", () => ({ __esModule: true, default: jest.fn() }));

const { useAudioPlayer } = require("@/hooks/useAudioPlayer");
const { useHeaderStore } = require("@/hooks/stores/useHeaderStore");
const { useAuth } = require("@/providers/AuthProvider");
const { useRouter, useLocalSearchParams } = require("expo-router");

describe("PlaylistDetailScreen", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    useAudioPlayer.mockReturnValue({ togglePlayPause: jest.fn(), currentSong: null });
        const mockSetShowHeader = jest.fn();
    useHeaderStore.mockImplementation((selector) => {
      const state = {
        showHeader: true,
        setShowHeader: mockSetShowHeader,
      };
      return selector(state);
    });
    useAuth.mockReturnValue({ session: { user: { id: "test-user" } }, setSession: jest.fn() });
    useRouter.mockReturnValue({ back: jest.fn() });
    useLocalSearchParams.mockReturnValue({ playlistId: "test-playlist-id" });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(<PlaylistDetailScreen />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });
});

