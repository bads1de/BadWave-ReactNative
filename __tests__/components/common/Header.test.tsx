import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Header from "@/components/common/Header";

jest.mock("@/hooks/useHeaderStore", () => ({
  useHeaderStore: jest.fn(),
}));

jest.mock("@/hooks/useAuthStore", () => ({
  useAuthStore: jest.fn(),
}));

jest.mock("@/providers/AuthProvider", () => ({
  useAuth: jest.fn(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

jest.mock("expo-image", () => ({
  Image: "Image",
}));

const { useHeaderStore } = require("@/hooks/useHeaderStore");
const { useAuthStore } = require("@/hooks/useAuthStore");
const { useAuth } = require("@/providers/AuthProvider");

describe("Header", () => {
  beforeEach(() => {
    useHeaderStore.mockReturnValue({ showHeader: true });
    useAuthStore.mockReturnValue({ setShowAuthModal: jest.fn() });
    useAuth.mockReturnValue({ session: null });
  });

  it("renders without crashing", () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    const { UNSAFE_root } = render(
      <QueryClientProvider client={queryClient}>
        <Header />
      </QueryClientProvider>
    );
    expect(UNSAFE_root).toBeTruthy();
  });
});
