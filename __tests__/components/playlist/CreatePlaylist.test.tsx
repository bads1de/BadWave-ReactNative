import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import CreatePlaylist from "@/components/playlist/CreatePlaylist";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useCreatePlaylist } from "@/hooks/mutations/useCreatePlaylist";
import { useAuth } from "@/providers/AuthProvider";
import Toast from "react-native-toast-message";
import { Alert } from "react-native";

// モック
jest.mock("@/hooks/common/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(),
}));
jest.mock("@/hooks/mutations/useCreatePlaylist", () => ({
  useCreatePlaylist: jest.fn(),
}));
jest.mock("@/providers/AuthProvider", () => ({
  useAuth: jest.fn(),
}));
jest.mock("react-native-toast-message", () => ({
  show: jest.fn(),
}));
jest.spyOn(Alert, "alert");
jest.mock("expo-haptics", () => ({
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light", Medium: "medium", Heavy: "heavy" },
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

const mockUseNetworkStatus = useNetworkStatus as jest.Mock;
const mockUseCreatePlaylist = useCreatePlaylist as jest.Mock;
const mockUseAuth = useAuth as jest.Mock;
const mockMutate = jest.fn();

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

describe("CreatePlaylist Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    mockUseAuth.mockReturnValue({ session: { user: { id: "u1" } } });
    mockUseCreatePlaylist.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    });
  });

  it("正常系: モーダルを開いて名前を入力し、プレイリストを作成できる", async () => {
    const { getByTestId, getByPlaceholderText } = render(<CreatePlaylist />, {
      wrapper: createWrapper(),
    });

    // モーダルを開く
    fireEvent.press(getByTestId("create-playlist-button"));

    // 入力
    fireEvent.changeText(
      getByPlaceholderText("My Awesome Playlist"),
      "New Cool Playlist",
    );

    // 作成実行
    fireEvent.press(getByTestId("create-button"));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { title: "New Cool Playlist" },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
    });

    const mutationOptions = mockMutate.mock.calls[0][1];
    mutationOptions.onSuccess();

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({ type: "success" }),
    );
  });

  it("空の名前で作成しようとするとエラーのトーストが表示される", () => {
    const { getByTestId } = render(<CreatePlaylist />, {
      wrapper: createWrapper(),
    });

    fireEvent.press(getByTestId("create-playlist-button"));
    fireEvent.press(getByTestId("create-button"));

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        text1: "プレイリスト名を入力してください",
      }),
    );
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("オフライン時にボタンを押すとアラートが表示される", () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });

    const { getByTestId } = render(<CreatePlaylist />, {
      wrapper: createWrapper(),
    });

    fireEvent.press(getByTestId("create-playlist-button"));

    expect(Alert.alert).toHaveBeenCalledWith(
      "オフラインです",
      "プレイリストの作成にはインターネット接続が必要です",
      expect.any(Array),
    );
  });
});
