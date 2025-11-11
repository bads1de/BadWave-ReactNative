import React from "react";
import { render } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import SpotlightBoard from "@/components/board/SpotlightBoard";

jest.mock("@/components/modal/SpotlightModal", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/common/Loading", () => ({ __esModule: true, default: () => null }));
jest.mock("@/components/common/Error", () => ({ __esModule: true, default: () => null }));
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
jest.mock("expo-av", () => ({ Video: "Video", ResizeMode: { CONTAIN: "contain" } }));
jest.mock("@/actions/getSpotlights", () => ({ __esModule: true, default: jest.fn() }));

describe("SpotlightBoard", () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  });

  const wrapper = ({ children }: any) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it("renders without crashing", () => {
    const { UNSAFE_root } = render(<SpotlightBoard />, { wrapper });
    expect(UNSAFE_root).toBeTruthy();
  });
});
