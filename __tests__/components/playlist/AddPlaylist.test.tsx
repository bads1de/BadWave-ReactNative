import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AddPlaylist from "@/components/playlist/AddPlaylist";
import { useAuth } from "@/providers/AuthProvider";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import usePlaylistStatus from "@/hooks/data/usePlaylistStatus";
import getPlaylists from "@/actions/playlist/getPlaylists";
import addPlaylistSong from "@/actions/playlist/addPlaylistSong";
import { Alert } from "react-native";
import Toast from "react-native-toast-message";

// モック
jest.mock("@/providers/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("@/hooks/common/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(),
}));
jest.mock("@/hooks/data/usePlaylistStatus", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/actions/playlist/getPlaylists", () => jest.fn());
jest.mock("@/actions/playlist/addPlaylistSong", () => jest.fn());
jest.mock("react-native-toast-message", () => ({ show: jest.fn() }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("expo-linear-gradient", () => ({ LinearGradient: "LinearGradient" }));
jest.spyOn(Alert, "alert");

jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
  NotificationFeedbackType: {
    Success: "success",
    Warning: "warning",
    Error: "error",
  },
}));
jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn(() => ({
    colors: {
      primary: "#000",
      background: "#fff",
      card: "#fff",
      border: "#eee",
      text: "#000",
      subText: "#666",
    },
  })),
}));

const mockUseAuth = useAuth as jest.Mock;
const mockUseNetworkStatus = useNetworkStatus as jest.Mock;
const mockUsePlaylistStatus = usePlaylistStatus as jest.Mock;
const mockGetPlaylists = getPlaylists as jest.Mock;
const mockAddPlaylistSong = addPlaylistSong as jest.Mock;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("AddPlaylist Component", () => {
  const mockPlaylists = [{ id: "p1", title: "My Playlist", userId: "u1" }];

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({ session: { user: { id: "u1" } } });
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    mockUsePlaylistStatus.mockReturnValue({ data: {}, refetch: jest.fn() });
    mockGetPlaylists.mockResolvedValue(mockPlaylists);
  });

  it("ボタンを押すとモーダルが開き、プレイリスト一覧が表示される", async () => {
    const { getByTestId, findByText } = render(<AddPlaylist songId="s1" />, {
      wrapper: createWrapper(),
    });

    fireEvent.press(getByTestId("add-playlist-button"));

    expect(await findByText("プレイリストに追加")).toBeTruthy();
    expect(await findByText("My Playlist")).toBeTruthy();
  });

  it("プレイリストを選択すると addPlaylistSong が実行される", async () => {
    mockAddPlaylistSong.mockResolvedValue({ success: true });

    const { getByTestId, findByText } = render(<AddPlaylist songId="s1" />, {
      wrapper: createWrapper(),
    });

    fireEvent.press(getByTestId("add-playlist-button"));
    const item = await findByText("My Playlist");
    fireEvent.press(item);

    await waitFor(() => {
      expect(mockAddPlaylistSong).toHaveBeenCalledWith(
        expect.objectContaining({
          playlistId: "p1",
          songId: "s1",
          userId: "u1",
        }),
      );
    });
  });

  it("オフライン時にボタンを押すとアラートが表示される", () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });

    const { getByTestId } = render(<AddPlaylist songId="s1" />, {
      wrapper: createWrapper(),
    });

    fireEvent.press(getByTestId("add-playlist-button"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "オフラインです",
      expect.any(String),
      expect.any(Array),
    );
  });

  it("未ログイン時にボタンを押すとトーストが表示される", () => {
    mockUseAuth.mockReturnValue({ session: null });

    const { getByTestId } = render(<AddPlaylist songId="s1" />, {
      wrapper: createWrapper(),
    });

    fireEvent.press(getByTestId("add-playlist-button"));

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        text1: "ログインが必要です",
      }),
    );
  });
});
