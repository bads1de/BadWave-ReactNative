import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import AccountScreen from "@/app/(tabs)/account";

// モック定義
jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn(),
}));

jest.mock("expo-router", () => ({
  useRouter: () => ({
    back: jest.fn(),
    replace: jest.fn(),
  }),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-linear-gradient", () => ({
  LinearGradient: "LinearGradient",
}));

jest.mock("expo-image", () => ({
  Image: "Image",
}));

jest.mock("@/lib/supabase", () => ({
  supabase: {
    auth: {
      signOut: jest.fn(),
    },
  },
}));

jest.mock("@/actions/getUser", () => ({
  useUser: jest.fn(),
}));

// フックのモック
const { useUser } = require("@/actions/getUser");
const { useThemeStore } = require("@/hooks/stores/useThemeStore");
const { THEMES } = require("@/constants/ThemeColors");

describe("AccountScreen", () => {
  const mockSetTheme = jest.fn();

  beforeEach(() => {
    useUser.mockReturnValue({
      data: {
        full_name: "Test User",
        avatar_url: "https://example.com/avatar.png",
      },
    });
    useThemeStore.mockReturnValue({
      colors: THEMES.violet.colors,
      currentTheme: "violet",
      setTheme: mockSetTheme,
    });
  });

  it("renders correctly", () => {
    const { getByText, getByTestId } = render(<AccountScreen />);

    expect(getByText("Account")).toBeTruthy();
    expect(getByText("Test User")).toBeTruthy();
    expect(getByText("FREE PLAN")).toBeTruthy();
    expect(getByTestId("back-button")).toBeTruthy();
  });

  it("renders menu items and theme selector", () => {
    const { getByText } = render(<AccountScreen />);

    expect(getByText("Settings")).toBeTruthy();
    expect(getByText("Appearance")).toBeTruthy();
    expect(getByText("Violet")).toBeTruthy();
    expect(getByText("Emerald")).toBeTruthy();
    expect(getByText("Privacy & Social")).toBeTruthy();
    expect(getByText("Log out")).toBeTruthy();
  });

  it("calls setTheme when a theme option is pressed", () => {
    const { getByText } = render(<AccountScreen />);

    // Emeraldテーマを選択
    fireEvent.press(getByText("Emerald"));

    expect(mockSetTheme).toHaveBeenCalledWith("emerald");
  });
});
