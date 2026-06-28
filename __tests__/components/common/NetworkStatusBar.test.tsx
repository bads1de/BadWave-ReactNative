import React from "react";
import { render } from "@testing-library/react-native";
import { NetworkStatusBar } from "@/components/common/NetworkStatusBar";

const mockUseNetworkStatus = jest.fn(() => ({
  isOnline: true,
}));

const mockUseSync = jest.fn(() => ({
  isSyncing: false,
}));

jest.mock("@/hooks/common/useNetworkStatus", () => ({
  useNetworkStatus: () => mockUseNetworkStatus(),
}));

jest.mock("@/providers/SyncProvider", () => ({
  useSync: () => mockUseSync(),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: ({ name, size, color }: any) => null,
}));

describe("NetworkStatusBar", () => {
  beforeEach(() => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    mockUseSync.mockReturnValue({ isSyncing: false });
  });

  it("should not render when online and not syncing", () => {
    const { queryByText } = render(<NetworkStatusBar />);
    expect(queryByText("オフラインです")).toBeNull();
  });

  it("should render offline message when offline", () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: false });

    const { getByText } = render(<NetworkStatusBar />);
    expect(getByText("オフラインです")).toBeTruthy();
  });

  it("should not render offline message when online and syncing", () => {
    mockUseNetworkStatus.mockReturnValue({ isOnline: true });
    mockUseSync.mockReturnValue({ isSyncing: true });

    const { queryByText } = render(<NetworkStatusBar />);
    expect(queryByText("オフラインです")).toBeNull();
  });
});
