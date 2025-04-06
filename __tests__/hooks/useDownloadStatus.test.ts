import { renderHook, waitFor } from "@testing-library/react-native";
import { useDownloadStatus, useDownloadSong, useDeleteDownloadedSong } from "../../hooks/useDownloadStatus";
import { OfflineStorageService } from "../../services/OfflineStorageService";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { act } from "react-test-renderer";

// モックの設定
jest.mock("../../services/OfflineStorageService", () => {
  return {
    OfflineStorageService: jest.fn().mockImplementation(() => ({
      downloadSong: jest.fn(),
      deleteSong: jest.fn(),
      isSongDownloaded: jest.fn(),
    })),
  };
});

// テスト用のラッパーコンポーネント
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
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
    mockOfflineStorageService = new OfflineStorageService() as jest.Mocked<OfflineStorageService>;

    // getOfflineStorageService関数をモック化
    jest
      .spyOn(require("../../hooks/TrackPlayer/utils"), "getOfflineStorageService")
      .mockReturnValue(mockOfflineStorageService);
  });

  it("useDownloadStatus returns download status", async () => {
    mockOfflineStorageService.isSongDownloaded.mockResolvedValue(true);

    const { result } = renderHook(() => useDownloadStatus("song-1"), {
      wrapper: createWrapper(),
    });

    // 初期状態はローディング中
    expect(result.current.isLoading).toBe(true);

    // データが取得されるまで待機
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // 正しいデータが返されることを確認
    expect(result.current.data).toBe(true);
    expect(mockOfflineStorageService.isSongDownloaded).toHaveBeenCalledWith("song-1");
  });

  it("useDownloadSong downloads a song", async () => {
    mockOfflineStorageService.downloadSong.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDownloadSong(), {
      wrapper: createWrapper(),
    });

    // ミューテーションを実行
    await act(async () => {
      result.current.mutate(mockSong);
    });

    // ダウンロード関数が呼ばれたことを確認
    expect(mockOfflineStorageService.downloadSong).toHaveBeenCalledWith(mockSong);
    // ミューテーションが成功したことを確認
    expect(result.current.isSuccess).toBe(true);
  });

  it("useDeleteDownloadedSong deletes a song", async () => {
    mockOfflineStorageService.deleteSong.mockResolvedValue({ success: true });

    const { result } = renderHook(() => useDeleteDownloadedSong(), {
      wrapper: createWrapper(),
    });

    // ミューテーションを実行
    await act(async () => {
      result.current.mutate("song-1");
    });

    // 削除関数が呼ばれたことを確認
    expect(mockOfflineStorageService.deleteSong).toHaveBeenCalledWith("song-1");
    // ミューテーションが成功したことを確認
    expect(result.current.isSuccess).toBe(true);
  });

  it("useDownloadSong handles download failure", async () => {
    mockOfflineStorageService.downloadSong.mockResolvedValue({
      success: false,
      error: "Download failed",
    });

    const { result } = renderHook(() => useDownloadSong(), {
      wrapper: createWrapper(),
    });

    // ミューテーションを実行
    await act(async () => {
      result.current.mutate(mockSong);
    });

    // ダウンロード関数が呼ばれたことを確認
    expect(mockOfflineStorageService.downloadSong).toHaveBeenCalledWith(mockSong);
    // ミューテーションが成功したことを確認（エラーはサービス内で処理されるため）
    expect(result.current.isSuccess).toBe(true);
  });

  it("useDeleteDownloadedSong handles deletion failure", async () => {
    mockOfflineStorageService.deleteSong.mockResolvedValue({
      success: false,
      error: "Deletion failed",
    });

    const { result } = renderHook(() => useDeleteDownloadedSong(), {
      wrapper: createWrapper(),
    });

    // ミューテーションを実行
    await act(async () => {
      result.current.mutate("song-1");
    });

    // 削除関数が呼ばれたことを確認
    expect(mockOfflineStorageService.deleteSong).toHaveBeenCalledWith("song-1");
    // ミューテーションが成功したことを確認（エラーはサービス内で処理されるため）
    expect(result.current.isSuccess).toBe(true);
  });
});
