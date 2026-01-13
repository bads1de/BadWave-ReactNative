import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import GenreSongsScreen from "@/app/(tabs)/genre/[genre]";

jest.mock("@/components/item/ListItem", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/common/Loading", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/common/Error", () => ({ __esModule: true, default: () => null }));
jest.mock("@/hooks/audio/useAudioPlayer", () => ({ useAudioPlayer: jest.fn() }));
jest.mock("@/hooks/stores/useHeaderStore", () => ({ useHeaderStore: jest.fn() }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useFocusEffect: jest.fn((fn) => fn()),
  useLocalSearchParams: jest.fn(),
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: "SafeAreaView",
}));
jest.mock("@/actions/getSongsByGenre", () => ({ __esModule: true, default: jest.fn() }));

const { useAudioPlayer } = require("@/hooks/audio/useAudioPlayer");
const { useHeaderStore } = require("@/hooks/stores/useHeaderStore");
const { useRouter, useLocalSearchParams } = require("expo-router");

describe("GenreSongsScreen", () => {
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
    useRouter.mockReturnValue({ back: jest.fn() });
    useLocalSearchParams.mockReturnValue({ genre: "Retro Wave" });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(<GenreSongsScreen />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });
});


