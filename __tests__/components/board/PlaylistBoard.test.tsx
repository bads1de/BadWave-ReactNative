import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import PlaylistBoard from "@/components/board/PlaylistBoard";

jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  return Reanimated;
});
jest.mock("expo-image", () => ({ Image: "Image" }));
jest.mock("expo-router", () => ({
  useRouter: jest.fn(() => ({ push: jest.fn() })),
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
jest.mock("@/actions/playlist/getPublicPlaylists", () => ({
  __esModule: true,
  default: jest.fn(),
}));
jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn(() => ({
    colors: { card: "#222", glow: "#333", primary: "#000" },
  })),
}));

describe("PlaylistBoard", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(<PlaylistBoard />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });
});
