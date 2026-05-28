import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import AuthModal from "@/components/modal/AuthModal";

jest.mock("@react-native-google-signin/google-signin", () => ({
  GoogleSignin: {
    configure: jest.fn(),
    hasPlayServices: jest.fn(),
    signIn: jest.fn(),
  },
  statusCodes: {
    SIGN_IN_CANCELLED: "SIGN_IN_CANCELLED",
    IN_PROGRESS: "IN_PROGRESS",
    PLAY_SERVICES_NOT_AVAILABLE: "PLAY_SERVICES_NOT_AVAILABLE",
  },
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      signUp: jest.fn(),
      signInWithIdToken: jest.fn(),
      signOut: jest.fn(),
    },
  },
}));

jest.mock("@/providers/AuthProvider", () => ({
  useAuth: jest.fn(() => ({
    session: null,
  })),
}));

jest.mock("@/hooks/stores/useAuthStore", () => ({
  useAuthStore: jest.fn((selector) =>
    selector({
      showAuthModal: true,
      setShowAuthModal: jest.fn(),
    })
  ),
}));

jest.mock("@tanstack/react-query", () => ({
  useQueryClient: jest.fn(() => ({
    invalidateQueries: jest.fn(),
    resetQueries: jest.fn(),
  })),
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: ({ children, ...props }: any) => children,
}));

jest.mock("lucide-react-native", () => ({
  Chrome: () => null,
  Mail: () => null,
  Lock: () => null,
  LogOut: () => null,
  X: () => null,
}));

jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn((selector) =>
    selector({
      colors: {
        primary: "#FF0000",
        primaryDark: "#FFFFFF",
        text: "#FFFFFF",
        subText: "#888888",
        background: "#000000",
        card: "#111111",
        border: "#333333",
      },
    })
  ),
}));

jest.mock("@/constants/theme", () => ({
  FONTS: {
    title: "System",
    body: "System",
    bold: "System",
    semibold: "System",
  },
}));

describe("AuthModal", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render login form when no session", () => {
    const { getByText } = render(<AuthModal />);

    expect(getByText("BadWave")).toBeTruthy();
    expect(getByText("ログイン")).toBeTruthy();
  });

  it("should render sign up form when toggled", () => {
    const { getByText } = render(<AuthModal />);

    fireEvent.press(getByText("アカウントをお持ちでない方はこちら"));

    expect(getByText("アカウントを作成")).toBeTruthy();
  });

  it("should toggle between login and sign up", () => {
    const { getByText } = render(<AuthModal />);

    fireEvent.press(getByText("アカウントをお持ちでない方はこちら"));
    expect(getByText("アカウントを作成")).toBeTruthy();

    fireEvent.press(getByText("すでにアカウントをお持ちの方はこちら"));
    expect(getByText("ログイン")).toBeTruthy();
  });

  it("should render Google login button", () => {
    const { getByText } = render(<AuthModal />);
    expect(getByText("Googleでログイン")).toBeTruthy();
  });
});
