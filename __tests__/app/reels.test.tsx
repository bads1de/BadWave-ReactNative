import React from "react";
import { render, screen, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import ReelsScreen from "@/app/(tabs)/reels";

// Mock dependencies
jest.mock("@/hooks/data/useGetLocalSpotlights", () => ({
  useGetLocalSpotlights: jest.fn(),
}));
jest.mock("@/components/reels/ReelsList", () => {
  const { View } = require("react-native");
  return () => <View testID="reels-list" />;
});
jest.mock("@/components/common/Loading", () => {
  const { Text } = require("react-native");
  return () => <Text>Loading...</Text>;
});
jest.mock("@/components/common/Error", () => {
  const { Text } = require("react-native");
  // @ts-ignore
  return ({ message }) => <Text>Error: {message}</Text>;
});
jest.mock("@/hooks/stores/useHeaderStore", () => ({
  useHeaderStore: jest.fn(() => jest.fn()),
}));
jest.mock("@/hooks/stores/usePlayerStore", () => ({
  usePlayerStore: jest.fn(() => jest.fn()),
}));
jest.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(() => ({ isOnline: true })),
}));
jest.mock("@react-navigation/native", () => ({
  ...jest.requireActual("@react-navigation/native"),
  useIsFocused: jest.fn(() => true),
}));

import { useGetLocalSpotlights } from "@/hooks/data/useGetLocalSpotlights";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
    },
  },
});

// @ts-ignore
const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe("ReelsScreen", () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    queryClient.clear();
    // Default: online
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
  });

  it("renders Loading component when data is loading", () => {
    (useGetLocalSpotlights as jest.Mock).mockReturnValue({
      data: [],
      isLoading: true,
      error: null,
    });

    render(<ReelsScreen />, { wrapper });

    expect(screen.getByText("Loading...")).toBeTruthy();
  });

  it("renders Error component when there is an error", async () => {
    const errorMessage = "Failed to fetch spotlights";
    (useGetLocalSpotlights as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: new Error(errorMessage),
    });

    render(<ReelsScreen />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText(`Error: ${errorMessage}`)).toBeTruthy();
    });
  });

  it("renders ReelsList when data is fetched successfully", async () => {
    const mockData = [{ id: "1", title: "Reel 1" }];
    (useGetLocalSpotlights as jest.Mock).mockReturnValue({
      data: mockData,
      isLoading: false,
      error: null,
    });

    render(<ReelsScreen />, { wrapper });

    await waitFor(() => {
      expect(screen.getByTestId("reels-list")).toBeTruthy();
    });
  });

  it("renders offline message when offline", async () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });
    (useGetLocalSpotlights as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<ReelsScreen />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText("You are offline")).toBeTruthy();
    });
  });

  it("calls setShowHeader and setIsMiniPlayerVisible on focus", () => {
    const setShowHeader = jest.fn();
    const setIsMiniPlayerVisible = jest.fn();
    // @ts-ignore
    require("@/hooks/stores/useHeaderStore").useHeaderStore.mockImplementation(
      // @ts-ignore
      (selector) => {
        if (selector.toString().includes("setShowHeader")) {
          return setShowHeader;
        }
        return jest.fn();
      }
    );
    // @ts-ignore
    require("@/hooks/stores/usePlayerStore").usePlayerStore.mockImplementation(
      // @ts-ignore
      (selector) => {
        if (selector.toString().includes("setIsMiniPlayerVisible")) {
          return setIsMiniPlayerVisible;
        }
        return jest.fn();
      }
    );
    (useGetLocalSpotlights as jest.Mock).mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    render(<ReelsScreen />, { wrapper });

    expect(setShowHeader).toHaveBeenCalledWith(false);
    expect(setIsMiniPlayerVisible).toHaveBeenCalledWith(false);
  });
});

