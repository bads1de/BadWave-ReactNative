import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TrendBoard from "@/components/board/TrendBoard";

jest.mock("expo-image", () => ({ ImageBackground: "ImageBackground" }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("@/hooks/audio/useAudioPlayer", () => ({ useAudioPlayer: jest.fn() }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("expo-blur", () => ({ BlurView: "BlurView" }));
jest.mock("@/components/common/CustomButton", () => ({
  __esModule: true,
  default: "CustomButton",
}));
jest.mock("@/components/common/Loading", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/common/Error", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/hooks/data/useGetLocalTrendSongs", () => ({
  useGetLocalTrendSongs: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
}));

const { useAudioPlayer } = require("@/hooks/audio/useAudioPlayer");

describe("TrendBoard", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useAudioPlayer.mockReturnValue({ onPlaySong: jest.fn() });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(<TrendBoard />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });
});

