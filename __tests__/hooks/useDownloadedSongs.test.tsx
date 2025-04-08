import { renderHook } from "@testing-library/react-native";
import { useDownloadedSongs } from "../../hooks/useDownloadedSongs";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";

// モックの設定
jest.mock("../../hooks/TrackPlayer/utils", () => ({
  getOfflineStorageService: jest.fn().mockReturnValue({
    getDownloadedSongs: jest.fn().mockResolvedValue([
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
    ]),
  }),
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
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useDownloadedSongs", () => {
  it("should initialize hook", () => {
    const { result } = renderHook(() => useDownloadedSongs(), {
      wrapper: createWrapper(),
    });

    // フックが正しく初期化されることを確認
    expect(result.current.songs).toEqual([]);
    expect(result.current.isLoading).toBe(true);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.refresh).toBe("function");
  });
});
