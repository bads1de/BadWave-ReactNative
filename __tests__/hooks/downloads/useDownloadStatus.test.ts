import { renderHook, waitFor } from "@testing-library/react-native";
import {
  useDownloadStatus,
  useDownloadSong,
  useDeleteDownloadedSong,
} from "@/hooks/downloads/useDownloadStatus";
import { OfflineStorageService } from "@/services/OfflineStorageService";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { act } from "react-test-renderer";

// OfflineStorageServiceのモック
jest.mock("@/services/OfflineStorageService", () => {
  return {
    OfflineStorageService: jest.fn().mockImplementation(() => ({
      downloadSong: jest.fn(),
      deleteSong: jest.fn(),
      isSongDownloaded: jest.fn(),
    })),
  };
});

// getOfflineStorageServiceのモック
jest.mock("@/hooks/audio/TrackPlayer/utils", () => ({
  getOfflineStorageService: jest.fn(),
}));

// テスト用のラッパーコンポーネント
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe("useDownloadStatus", () => {
  let mockOfflineStorageService: jest.Mocked<OfflineStorageService>;

  const mockSong = {
    id: "song-1",
    title: "Test Song",
    author: "Test Artist",
    image_path: "https://example.com/image.jpg",
    song_path: "https://example.com/song.mp3",
    user_id: "test-user",
    created_at: "2023-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockOfflineStorageService =
      new OfflineStorageService() as jest.Mocked<OfflineStorageService>;

    const {
      getOfflineStorageService,
    } = require("@/hooks/audio/TrackPlayer/utils");
    (getOfflineStorageService as jest.Mock).mockReturnValue(
      mockOfflineStorageService
    );
  });

  it("useDownloadStatus returns download status", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(true);

    const { result } = renderHook(() => useDownloadStatus("song-1"), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBe(true);
    expect(mockOfflineStorageService.isSongDownloaded).toHaveBeenCalledWith(
      "song-1"
    );
  });

  it("useDownloadSong downloads a song", async () => {
    mockOfflineStorageService.downloadSong.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDownloadSong(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(mockSong);
    });

    expect(mockOfflineStorageService.downloadSong).toHaveBeenCalledWith(
      mockSong
    );

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("useDeleteDownloadedSong deletes a song", async () => {
    mockOfflineStorageService.deleteSong.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteDownloadedSong(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate("song-1");
    });

    expect(mockOfflineStorageService.deleteSong).toHaveBeenCalledWith("song-1");

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("useDownloadSong handles download failure", async () => {
    mockOfflineStorageService.downloadSong.mockResolvedValue({
      success: false,
      error: "Download failed",
    });

    const { result } = renderHook(() => useDownloadSong(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate(mockSong);
    });

    expect(mockOfflineStorageService.downloadSong).toHaveBeenCalledWith(
      mockSong
    );

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it("useDeleteDownloadedSong handles deletion failure", async () => {
    mockOfflineStorageService.deleteSong.mockResolvedValue({
      success: false,
      error: "Deletion failed",
    });

    const { result } = renderHook(() => useDeleteDownloadedSong(), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      result.current.mutate("song-1");
    });

    expect(mockOfflineStorageService.deleteSong).toHaveBeenCalledWith("song-1");

    // 非同期処理の完了を待つ
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });
});

