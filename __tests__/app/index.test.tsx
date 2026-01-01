import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import HomeScreen from "@/app/(tabs)/index";

jest.mock("@/components/item/SongItem", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/board/TrendBoard", () => ({
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
jest.mock("@/components/board/PlaylistBoard", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/board/ForYouBoard", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/board/HeroBoard", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/hooks/useAudioPlayer", () => ({ useAudioPlayer: jest.fn() }));
jest.mock("@/hooks/usePlayerStore", () => ({ usePlayerStore: jest.fn() }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("@/hooks/data/useGetLocalSongs", () => ({
  useGetLocalSongs: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

const { useAudioPlayer } = require("@/hooks/useAudioPlayer");
const { usePlayerStore } = require("@/hooks/usePlayerStore");
const { useGetLocalSongs } = require("@/hooks/data/useGetLocalSongs");

describe("HomeScreen", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useAudioPlayer.mockReturnValue({
      togglePlayPause: jest.fn(),
      currentSong: null,
    });
    usePlayerStore.mockReturnValue({ showPlayer: false });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(<HomeScreen />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });
});
