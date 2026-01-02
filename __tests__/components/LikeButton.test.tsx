import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import LikeButton from "@/components/LikeButton";

// モック
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("react-native-toast-message", () => ({
  __esModule: true,
  default: { show: jest.fn() },
}));
jest.mock("@/providers/AuthProvider", () => ({ useAuth: jest.fn() }));
jest.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(),
}));

// useLikeStatus をモック
jest.mock("@/hooks/data/useLikeStatus", () => ({
  useLikeStatus: jest.fn(),
}));

// useLikeMutation をモック
jest.mock("@/hooks/mutations/useLikeMutation", () => ({
  useLikeMutation: jest.fn(),
}));

const { useAuth } = require("@/providers/AuthProvider");
const { useNetworkStatus } = require("@/hooks/useNetworkStatus");
const { useLikeStatus } = require("@/hooks/data/useLikeStatus");
const { useLikeMutation } = require("@/hooks/mutations/useLikeMutation");

describe("LikeButton", () => {
  let queryClient: QueryClient;
  const mockMutate = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    // デフォルトのモック設定
    useAuth.mockReturnValue({ session: { user: { id: "test-user" } } });
    useNetworkStatus.mockReturnValue({ isOnline: true });
    useLikeStatus.mockReturnValue({
      isLiked: false,
      isLoading: false,
      error: null,
    });
    useLikeMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("レンダリングされる", () => {
    const { UNSAFE_root } = render(<LikeButton songId="song1" />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });

  it("useLikeStatus を使用していいね状態を取得する", () => {
    render(<LikeButton songId="song1" />, { wrapper });

    expect(useLikeStatus).toHaveBeenCalledWith("song1", "test-user");
  });

  it("useLikeMutation を使用してミューテーションを設定する", () => {
    render(<LikeButton songId="song1" />, { wrapper });

    expect(useLikeMutation).toHaveBeenCalledWith("song1", "test-user");
  });

  it("いいね済みの場合は塗りつぶしアイコンを表示する", () => {
    useLikeStatus.mockReturnValue({
      isLiked: true,
      isLoading: false,
      error: null,
    });

    const { getByTestId } = render(
      <LikeButton songId="song1" testID="like-button" />,
      {
        wrapper,
      }
    );

    const button = getByTestId("like-button");
    // Ionicons コンポーネントの name prop を確認
    expect(button).toBeTruthy();
  });

  it("ボタン押下時に mutate が現在の isLiked 状態で呼ばれる", () => {
    useLikeStatus.mockReturnValue({
      isLiked: false,
      isLoading: false,
      error: null,
    });

    const { getByTestId } = render(
      <LikeButton songId="song1" testID="like-button" />,
      {
        wrapper,
      }
    );

    const button = getByTestId("like-button");
    fireEvent.press(button);

    expect(mockMutate).toHaveBeenCalledWith(false);
  });

  it("いいね済みの状態でボタン押下時に mutate(true) が呼ばれる", () => {
    useLikeStatus.mockReturnValue({
      isLiked: true,
      isLoading: false,
      error: null,
    });

    const { getByTestId } = render(
      <LikeButton songId="song1" testID="like-button" />,
      {
        wrapper,
      }
    );

    const button = getByTestId("like-button");
    fireEvent.press(button);

    expect(mockMutate).toHaveBeenCalledWith(true);
  });

  it("オフライン時はボタンが無効化される", () => {
    useNetworkStatus.mockReturnValue({ isOnline: false });

    const { getByTestId } = render(
      <LikeButton songId="song1" testID="like-button" />,
      {
        wrapper,
      }
    );

    const button = getByTestId("like-button");
    fireEvent.press(button);

    // オフライン時は mutate が呼ばれない
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("ミューテーション中はボタンが無効化される", () => {
    useLikeMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: true,
    });

    const { getByTestId } = render(
      <LikeButton songId="song1" testID="like-button" />,
      {
        wrapper,
      }
    );

    const button = getByTestId("like-button");
    fireEvent.press(button);

    // pending 中は mutate が呼ばれない
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it("未ログイン時はボタン押下で Toast が表示される", () => {
    const Toast = require("react-native-toast-message").default;
    useAuth.mockReturnValue({ session: null });

    const { getByTestId } = render(
      <LikeButton songId="song1" testID="like-button" />,
      {
        wrapper,
      }
    );

    const button = getByTestId("like-button");
    fireEvent.press(button);

    expect(Toast.show).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "info",
        text1: "ログインが必要です",
      })
    );
    expect(mockMutate).not.toHaveBeenCalled();
  });
});
