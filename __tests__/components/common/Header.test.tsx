import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Header from "@/components/common/Header";

jest.mock("@/hooks/stores/useHeaderStore", () => ({
  useHeaderStore: jest.fn(),
}));

jest.mock("@/hooks/stores/useAuthStore", () => ({
  useAuthStore: jest.fn(),
}));

jest.mock("@/providers/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@/actions/getUser", () => ({
  useUser: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-image", () => ({
  Image: "Image",
}));

// モックの定義
const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

const { useHeaderStore } = require("@/hooks/stores/useHeaderStore");
const { useAuthStore } = require("@/hooks/stores/useAuthStore");
const { useAuth } = require("@/providers/AuthProvider");
const { useUser } = require("@/actions/getUser");

describe("Header", () => {
  let setShowAuthModal: jest.Mock;

  beforeEach(() => {
    setShowAuthModal = jest.fn();
    // Zustandのセレクタパターンに対応するためのモック実装
    useHeaderStore.mockImplementation((selector) =>
      selector({ showHeader: true })
    );
    useAuthStore.mockImplementation((selector) =>
      selector({ setShowAuthModal })
    );

    useAuth.mockReturnValue({ session: null });
    useUser.mockReturnValue({ data: null });
    // モックのリセット
    mockPush.mockClear();
    setShowAuthModal.mockClear();
  });

  const renderHeader = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    return render(
      <QueryClientProvider client={queryClient}>
        <Header />
      </QueryClientProvider>
    );
  };

  it("renders without crashing", () => {
    const { UNSAFE_root } = renderHeader();
    expect(UNSAFE_root).toBeTruthy();
  });

  it("navigates to /account when user icon is pressed (logged in)", () => {
    // ログイン状態にする
    useAuth.mockReturnValue({ session: { user: { id: "test-user" } } });
    useUser.mockReturnValue({
      data: { avatar_url: "https://example.com/avatar.png" },
    });

    const { getByTestId } = renderHeader();
    const userButton = getByTestId("user-icon-button");

    fireEvent.press(userButton);

    expect(mockPush).toHaveBeenCalledWith("/account");
  });

  it("opens auth modal when login button is pressed (logged out)", () => {
    // 未ログイン状態（デフォルト）
    const { getByText } = renderHeader();
    const loginButton = getByText("Login");

    fireEvent.press(loginButton);

    expect(setShowAuthModal).toHaveBeenCalledWith(true);
  });
});

