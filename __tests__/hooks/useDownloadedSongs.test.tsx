import { renderHook, waitFor } from "@testing-library/react-native";
import { act } from "react-test-renderer";
import { useDownloadedSongs } from "../../hooks/useDownloadedSongs";
import { OfflineStorageService } from "../../services/OfflineStorageService";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// モックの設定
jest.mock("../../services/OfflineStorageService", () => {
  return {
    OfflineStorageService: jest.fn().mockImplementation(() => ({
      getDownloadedSongs: jest.fn(),
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

describe("useDownloadedSongs", () => {
  let mockOfflineStorageService: jest.Mocked<OfflineStorageService>;

  const mockSongs = [
    {
      id: "song-1",
      title: "Test Song 1",
      author: "Test Artist 1",
      image_path: "https://example.com/image1.jpg",
      song_path: "/local/path/song1.mp3",
      user_id: "test-user",
      created_at: "2023-01-01T00:00:00.000Z",
    },
    {
      id: "song-2",
      title: "Test Song 2",
      author: "Test Artist 2",
      image_path: "https://example.com/image2.jpg",
      song_path: "/local/path/song2.mp3",
      user_id: "test-user",
      created_at: "2023-01-01T00:00:00.000Z",
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    mockOfflineStorageService =
      new OfflineStorageService() as jest.Mocked<OfflineStorageService>;

    // getOfflineStorageService関数をモック化
    jest
      .spyOn(
        require("../../hooks/TrackPlayer/utils"),
        "getOfflineStorageService"
      )
      .mockReturnValue(mockOfflineStorageService);
  });

  it("should return downloaded songs", async () => {
    mockOfflineStorageService.getDownloadedSongs.mockResolvedValue(mockSongs);

    const { result } = renderHook(() => useDownloadedSongs(), {
      wrapper: createWrapper(),
    });

    // 初期状態は空配列とローディング状態
    expect(result.current.songs).toEqual([]);
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // データ取得後
    expect(result.current.songs).toEqual(mockSongs);
    expect(result.current.isLoading).toBe(false);
    expect(mockOfflineStorageService.getDownloadedSongs).toHaveBeenCalledTimes(
      1
    );
  });

  it("should handle refresh", async () => {
    mockOfflineStorageService.getDownloadedSongs
      .mockResolvedValueOnce(mockSongs)
      .mockResolvedValueOnce([
        ...mockSongs,
        {
          id: "song-3",
          title: "Test Song 3",
          author: "Test Artist 3",
          image_path: "https://example.com/image3.jpg",
          song_path: "/local/path/song3.mp3",
          user_id: "user-1",
          created_at: "2023-01-01T00:00:00.000Z",
        },
      ]);

    const { result } = renderHook(() => useDownloadedSongs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 初回データ取得
    expect(result.current.songs).toEqual(mockSongs);
    expect(result.current.isLoading).toBe(false);

    // リフレッシュ
    act(() => {
      result.current.refresh();
    });

    // リフレッシュ中はローディング状態
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // リフレッシュ後は新しいデータ
    expect(result.current.songs.length).toBe(3);
    expect(mockOfflineStorageService.getDownloadedSongs).toHaveBeenCalledTimes(
      2
    );
  });

  it("should handle error", async () => {
    const error = new Error("Failed to fetch");
    mockOfflineStorageService.getDownloadedSongs.mockRejectedValue(error);

    const { result } = renderHook(() => useDownloadedSongs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // エラー時は空配列とエラー状態
    expect(result.current.songs).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("Failed to fetch");
  });

  it("should handle empty result", async () => {
    mockOfflineStorageService.getDownloadedSongs.mockResolvedValue([]);

    const { result } = renderHook(() => useDownloadedSongs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 空の配列が返されることを確認
    expect(result.current.songs).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("should handle refresh with error", async () => {
    // 初回は成功、リフレッシュ時にエラー
    mockOfflineStorageService.getDownloadedSongs
      .mockResolvedValueOnce(mockSongs)
      .mockRejectedValueOnce(new Error("Refresh failed"));

    const { result } = renderHook(() => useDownloadedSongs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 初回データ取得
    expect(result.current.songs).toEqual(mockSongs);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();

    // リフレッシュ
    act(() => {
      result.current.refresh();
    });

    // リフレッシュ中はローディング状態
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // エラー後は空の配列が返される
    expect(result.current.songs).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("Refresh failed");
  });

  it("should handle concurrent refreshes", async () => {
    mockOfflineStorageService.getDownloadedSongs
      .mockResolvedValueOnce(mockSongs)
      .mockResolvedValueOnce([
        ...mockSongs,
        {
          id: "song-3",
          title: "Test Song 3",
          author: "Test Artist 3",
          image_path: "https://example.com/image3.jpg",
          song_path: "/local/path/song3.mp3",
          user_id: "user-1",
          created_at: "2023-01-01T00:00:00.000Z",
        },
      ]);

    const { result } = renderHook(() => useDownloadedSongs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // 複数回リフレッシュを呼ぶ
    act(() => {
      result.current.refresh();
      result.current.refresh(); // 2回目は無視されるはず
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // getDownloadedSongsは2回呼ばれることを確認
    // 1回目は初期化時、2回目は最初のrefresh呼び出し時
    expect(mockOfflineStorageService.getDownloadedSongs).toHaveBeenCalledTimes(
      2
    );
  });
});
