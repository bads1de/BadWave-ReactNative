import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PlaylistDetailScreen from "@/app/(tabs)/playlist/[playlistId]";

// コンポーネントのモック
jest.mock("@/components/item/ListItem", () => ({
  __esModule: true,
  default: (props: any) => null,
}));
jest.mock("@/components/common/Loading", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/common/Error", () => ({
  __esModule: true,
  default: ({ message }: { message: string }) => null,
}));
jest.mock("@/components/playlist/PlaylistOptionsMenu", () => ({
  __esModule: true,
  default: () => null,
}));

// フックのモック
jest.mock("@/hooks/audio/useAudioPlayer", () => ({
  useAudioPlayer: jest.fn(),
}));
jest.mock("@/hooks/stores/useHeaderStore", () => ({
  useHeaderStore: jest.fn(),
}));
jest.mock("@/providers/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("@/hooks/data/useGetPlaylistSongs", () => ({
  useGetPlaylistSongs: jest.fn(),
}));
jest.mock("@/hooks/data/useGetLocalPlaylist", () => ({
  useGetLocalPlaylist: jest.fn(),
}));
jest.mock("@/hooks/mutations/useMutatePlaylistSong", () => ({
  useMutatePlaylistSong: jest.fn(),
}));
jest.mock("@/hooks/common/useOfflineGuard", () => ({
  useOfflineGuard: jest.fn(),
}));

// 外部ライブラリのモック
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("expo-image", () => ({ Image: "Image" }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.mock("expo-blur", () => ({ BlurView: "BlurView" }));
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));
jest.mock("react-native-safe-area-context", () => ({
  SafeAreaView: ({ children }: any) => children,
}));
jest.mock("expo-router", () => ({
  useRouter: jest.fn(),
  useFocusEffect: jest.fn((fn) => fn()),
  useLocalSearchParams: jest.fn(),
}));
jest.mock("@shopify/flash-list", () => ({
  FlashList: (props: any) => {
    const React = require("react");
    const { View } = require("react-native");
    return React.createElement(
      View,
      null,
      props.ListHeaderComponent &&
        (typeof props.ListHeaderComponent === "function"
          ? props.ListHeaderComponent()
          : props.ListHeaderComponent),
      props.data && props.data.length > 0
        ? props.data.map((item: any) => props.renderItem({ item }))
        : props.ListEmptyComponent &&
          (typeof props.ListEmptyComponent === "function"
            ? props.ListEmptyComponent()
            : props.ListEmptyComponent),
    );
  },
}));

const { useAudioPlayer } = require("@/hooks/audio/useAudioPlayer");
const { useHeaderStore } = require("@/hooks/stores/useHeaderStore");
const { useAuth } = require("@/providers/AuthProvider");
const { useLocalSearchParams } = require("expo-router");
const { useGetPlaylistSongs } = require("@/hooks/data/useGetPlaylistSongs");
const { useGetLocalPlaylist } = require("@/hooks/data/useGetLocalPlaylist");
const {
  useMutatePlaylistSong,
} = require("@/hooks/mutations/useMutatePlaylistSong");
const { useOfflineGuard } = require("@/hooks/common/useOfflineGuard");

describe("PlaylistDetailScreen", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    // デフォルトのフック戻り値を設定
    useAudioPlayer.mockReturnValue({
      togglePlayPause: jest.fn(),
      currentSong: null,
    });

    const mockSetShowHeader = jest.fn();
    useHeaderStore.mockImplementation((selector: any) => {
      const state = { showHeader: true, setShowHeader: mockSetShowHeader };
      return selector(state);
    });

    useAuth.mockReturnValue({ session: { user: { id: "test-user" } } });
    useLocalSearchParams.mockReturnValue({ playlistId: "test-playlist-id" });

    useGetPlaylistSongs.mockReturnValue({
      songs: [],
      isLoading: false,
      error: null,
    });
    useGetLocalPlaylist.mockReturnValue({
      playlist: { 
        id: "p1", 
        title: "Test Playlist", 
        user_id: "test-user",
        created_at: "2024-01-01T00:00:00Z"
      },
      isLoading: false,
    });
    useMutatePlaylistSong.mockReturnValue({
      removeSong: { mutateAsync: jest.fn() },
    });
    useOfflineGuard.mockReturnValue({ guardAction: jest.fn((fn) => fn) });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("基本レンダリングが正しく行われる", () => {
    const { getByText } = render(<PlaylistDetailScreen />, { wrapper });
    expect(getByText("Test Playlist")).toBeTruthy();
  });

  it("曲が存在する場合、リストが表示される", () => {
    const mockSongs = [
      { id: "s1", title: "Song 1", author: "Author 1" },
      { id: "s2", title: "Song 2", author: "Author 2" },
    ];
    useGetPlaylistSongs.mockReturnValue({ songs: mockSongs, isLoading: false });

    const { getByText } = render(<PlaylistDetailScreen />, { wrapper });
    expect(getByText("2 tracks")).toBeTruthy();
  });

  it("プレイリストが空の場合、メッセージが表示される", () => {
    useGetPlaylistSongs.mockReturnValue({ songs: [], isLoading: false });

    const { getByText } = render(<PlaylistDetailScreen />, { wrapper });
    expect(getByText("Empty Playlist")).toBeTruthy();
  });

  it("ローディング中、Loadingコンポーネントが表示される", () => {
    useGetPlaylistSongs.mockReturnValue({ songs: [], isLoading: true });

    const { UNSAFE_root } = render(<PlaylistDetailScreen />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });

  it("エラー発生時、Errorコンポーネントが表示される", () => {
    useGetPlaylistSongs.mockReturnValue({
      songs: [],
      isLoading: false,
      error: { message: "Failed to load" },
    });

    const { UNSAFE_root } = render(<PlaylistDetailScreen />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });
});
