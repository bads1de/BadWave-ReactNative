import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SearchScreen from "@/app/(tabs)/search";

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  return Reanimated;
});
jest.mock("@/components/item/ListItem", () => ({
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
jest.mock("@/hooks/audio/useAudioPlayer", () => ({
  useAudioPlayer: jest.fn(),
  usePlayControls: jest.fn(() => ({ togglePlayPause: jest.fn() })),
}));
jest.mock("@/hooks/stores/useSearchHistoryStore", () => ({
  useSearchHistoryStore: jest.fn((selector?: any) => {
    const state = {
      history: [],
      addQuery: jest.fn(),
      removeQuery: jest.fn(),
      clearHistory: jest.fn(),
      loadHistory: jest.fn(),
    };
    return selector ? selector(state) : state;
  }),
}));
jest.mock("@/hooks/common/useDebounce", () => ({
  useDebounce: jest.fn((value) => value),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("expo-router", () => ({ useRouter: jest.fn() }));
jest.mock("@/actions/song/getSongsByTitle", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/actions/playlist/getPlaylistsByTitle", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const { useAudioPlayer } = require("@/hooks/audio/useAudioPlayer");
const { useRouter } = require("expo-router");

describe("SearchScreen", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useAudioPlayer.mockReturnValue({
      togglePlayPause: jest.fn(),
      currentSong: null,
    });
    useRouter.mockReturnValue({ push: jest.fn() });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(<SearchScreen />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });
});
