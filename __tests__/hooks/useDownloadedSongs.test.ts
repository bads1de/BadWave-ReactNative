import { renderHook, waitFor } from "@testing-library/react-native";

import { act } from "react-test-renderer";
import { useDownloadedSongs } from "../../hooks/useDownloadedSongs";
import { OfflineStorageService } from "../../services/OfflineStorageService";

// モックの設定
jest.mock("../../services/OfflineStorageService", () => {
  return {
    OfflineStorageService: jest.fn().mockImplementation(() => ({
      getDownloadedSongs: jest.fn(),
    })),
  };
});

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

    const { result } = renderHook(() => useDownloadedSongs());

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

    const { result } = renderHook(() => useDownloadedSongs());

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

    const { result } = renderHook(() => useDownloadedSongs());

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    // エラー時は空配列とエラー状態
    expect(result.current.songs).toEqual([]);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe("Failed to fetch");
  });
});
