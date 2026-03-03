import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SongDetailScreen from "@/app/(tabs)/song/[songId]";

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  return Reanimated;
});
jest.mock("@/components/common/Loading", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/common/Error", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/common/BackButton", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/LikeButton", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/playlist/AddPlaylist", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/player/lyric", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/hooks/audio/useAudioPlayer", () => ({
  useAudioPlayer: jest.fn(),
  useIsPlaying: jest.fn(() => false),
  usePlayControls: jest.fn(() => ({ togglePlayPause: jest.fn() })),
}));
jest.mock("@/hooks/stores/useAudioStore", () => ({
  useAudioStore: jest.fn((selector: any) =>
    selector({ currentSong: null, repeatMode: 0, shuffle: false }),
  ),
}));
jest.mock("@/hooks/stores/useHeaderStore", () => ({
  useHeaderStore: jest.fn(),
}));
jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn(() => ({
    colors: { primary: "#D4AF37", background: "#0A0A0A", text: "#fff" },
  })),
}));
jest.mock("@/hooks/data/useGetLocalSongById", () => ({
  useGetLocalSongById: jest.fn(() => ({
    data: null,
    isLoading: false,
    error: null,
  })),
}));
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("expo-image", () => ({
  Image: "Image",
  ImageBackground: "ImageBackground",
}));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: "SafeAreaView",
  useSafeAreaInsets: jest.fn(() => ({ top: 0, bottom: 0, left: 0, right: 0 })),
}));
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useFocusEffect: jest.fn((fn) => fn()),
  useLocalSearchParams: jest.fn(),
}));

const { useAudioPlayer } = require("@/hooks/audio/useAudioPlayer");
const { useHeaderStore } = require("@/hooks/stores/useHeaderStore");
const { useRouter, useLocalSearchParams } = require("expo-router");

describe("SongDetailScreen", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    useAudioPlayer.mockReturnValue({
      togglePlayPause: jest.fn(),
      currentSong: null,
      isPlaying: false,
    });
    const mockSetShowHeader = jest.fn();
    useHeaderStore.mockImplementation((selector: any) => {
      const state = { showHeader: true, setShowHeader: mockSetShowHeader };
      return selector(state);
    });
    useRouter.mockReturnValue({ back: jest.fn() });
    useLocalSearchParams.mockReturnValue({ songId: "test-song-id" });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(<SongDetailScreen />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });
});
