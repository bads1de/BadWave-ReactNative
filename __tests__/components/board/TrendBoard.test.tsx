import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import TrendBoard from "@/components/board/TrendBoard";

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  return Reanimated;
});
jest.mock("expo-image", () => ({ ImageBackground: "ImageBackground" }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("expo-blur", () => ({ BlurView: "BlurView" }));
jest.mock("@/components/common/CustomButton", () => {
  const React = require("react");
  const { TouchableOpacity, Text } = require("react-native");

  return {
    __esModule: true,
    default: ({ label, onPress }: any) => (
      <TouchableOpacity onPress={onPress}>
        <Text>{label}</Text>
      </TouchableOpacity>
    ),
  };
});
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
jest.mock("@/hooks/audio/useAudioPlayer", () => ({
  usePlayControls: jest.fn(() => ({ togglePlayPause: jest.fn() })),
}));
jest.mock("@/hooks/common/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(() => ({ isOnline: true })),
}));
jest.mock("@/hooks/downloads/useDownloadedSongs", () => ({
  useDownloadedSongs: jest.fn(() => ({ songs: [] })),
}));
jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn((selector: any) =>
    selector({
      colors: { primary: "#D4AF37", activeTab: "#2A2A2A" },
    }),
  ),
}));

const { useGetLocalTrendSongs } = require("@/hooks/data/useGetLocalTrendSongs");

describe("TrendBoard", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(<TrendBoard />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });

  it("shows the period selector even when trend data is empty", () => {
    useGetLocalTrendSongs.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    const { getByText } = render(<TrendBoard />, { wrapper });

    expect(getByText("トレンドデータがありません")).toBeTruthy();
    expect(getByText("All")).toBeTruthy();
    expect(getByText("Month")).toBeTruthy();
    expect(getByText("Week")).toBeTruthy();
    expect(getByText("Day")).toBeTruthy();
  });
});
