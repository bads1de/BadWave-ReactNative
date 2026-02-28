import React from "react";
import { render, fireEvent } from "@testing-library/react-native";
import { BulkDownloadButton } from "@/components/download/BulkDownloadButton";
import { useBulkDownload } from "@/hooks/downloads/useBulkDownload";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { Alert } from "react-native";

// Mock dependencies
jest.mock("@/hooks/downloads/useBulkDownload", () => ({
  useBulkDownload: jest.fn(),
}));

jest.mock("@/hooks/common/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(),
}));

jest.mock("@/hooks/stores/useThemeStore", () => ({
  useThemeStore: jest.fn(() => ({
    colors: {
      primary: "#FF0000",
      text: "#FFFFFF",
    },
  })),
}));

jest.mock("@expo/vector-icons", () => ({
  Ionicons: "Ionicons",
}));

// mock modal
jest.mock("@/components/download/BulkDownloadModal", () => ({
  BulkDownloadModal: () => null,
}));

describe("BulkDownloadButton", () => {
  const mockSongs = [{ id: "1", title: "Song 1" } as any];

  beforeEach(() => {
    jest.clearAllMocks();
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
    (useBulkDownload as jest.Mock).mockReturnValue({
      status: "none",
      downloadedCount: 0,
      totalCount: 1,
      isDownloading: false,
      progress: { current: 0, total: 1 },
      error: null,
      startDownload: jest.fn(),
      startDelete: jest.fn(),
      cancel: jest.fn(),
    });
  });

  it("renders 'Download All' when status is none", () => {
    const { getByText } = render(<BulkDownloadButton songs={mockSongs} />);
    expect(getByText(/すべてダウンロード \(1曲\)/)).toBeTruthy();
  });

  it("renders 'Download Remaining' when status is partial", () => {
    (useBulkDownload as jest.Mock).mockReturnValue({
      status: "partial",
      downloadedCount: 1,
      totalCount: 3,
      isDownloading: false,
      progress: { current: 1, total: 3 },
      error: null,
      startDownload: jest.fn(),
      startDelete: jest.fn(),
      cancel: jest.fn(),
    });

    const { getByText } = render(<BulkDownloadButton songs={mockSongs} />);
    expect(getByText(/残りをダウンロード \(2曲\)/)).toBeTruthy();
  });

  it("renders 'Delete All' when status is all", () => {
    (useBulkDownload as jest.Mock).mockReturnValue({
      status: "all",
      downloadedCount: 1,
      totalCount: 1,
      isDownloading: false,
      progress: { current: 1, total: 1 },
      error: null,
      startDownload: jest.fn(),
      startDelete: jest.fn(),
      cancel: jest.fn(),
    });

    const { getByText } = render(<BulkDownloadButton songs={mockSongs} />);
    expect(getByText("すべて削除")).toBeTruthy();
  });

  it("calls startDownload when download button is pressed", () => {
    const startDownload = jest.fn();
    (useBulkDownload as jest.Mock).mockReturnValue({
      status: "none",
      downloadedCount: 0,
      totalCount: 1,
      isDownloading: false,
      progress: { current: 0, total: 1 },
      error: null,
      startDownload,
      startDelete: jest.fn(),
      cancel: jest.fn(),
    });

    const { getByText } = render(<BulkDownloadButton songs={mockSongs} />);
    fireEvent.press(getByText(/すべてダウンロード/));

    expect(startDownload).toHaveBeenCalled();
  });

  it("shows offline alert when offline and download pressed", () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });
    const spyAlert = jest.spyOn(Alert, "alert");

    const { getByText } = render(<BulkDownloadButton songs={mockSongs} />);
    fireEvent.press(getByText(/すべてダウンロード/));

    expect(spyAlert).toHaveBeenCalledWith("オフライン", expect.any(String));
  });
});
