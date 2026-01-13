import { renderHook, act, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useBulkDownload } from "@/hooks/downloads/useBulkDownload";
import { getOfflineStorageService } from "@/hooks/audio/TrackPlayer/utils";
import Song from "@/types";

// モック
jest.mock("@/hooks/audio/TrackPlayer/utils", () => ({
  getOfflineStorageService: jest.fn(),
}));

const mockGetOfflineStorageService = getOfflineStorageService as jest.Mock;

// テスト用の曲データ
const createMockSong = (id: string, title: string): Song => ({
  id,
  user_id: "user1",
  title,
  author: "Test Artist",
  image_path: `https://example.com/${id}.jpg`,
  song_path: `https://example.com/${id}.mp3`,
  count: "10",
  like_count: "5",
  created_at: "2024-01-01",
});

const mockSongs: Song[] = [
  createMockSong("song1", "Song 1"),
  createMockSong("song2", "Song 2"),
  createMockSong("song3", "Song 3"),
];

// テスト用のラッパー
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      children
    );
  };
};

describe("useBulkDownload", () => {
  let mockOfflineService: {
    isSongDownloaded: jest.Mock;
    downloadSong: jest.Mock;
    deleteSong: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    mockOfflineService = {
      isSongDownloaded: jest.fn(),
      downloadSong: jest.fn(),
      deleteSong: jest.fn(),
    };

    mockGetOfflineStorageService.mockReturnValue(mockOfflineService);
  });

  describe("初期状態", () => {
    it("初期状態では isDownloading が false である", () => {
      const { result } = renderHook(() => useBulkDownload(mockSongs), {
        wrapper: createWrapper(),
      });

      expect(result.current.isDownloading).toBe(false);
    });

    it("初期状態では progress が { current: 0, total: 0 } である", () => {
      const { result } = renderHook(() => useBulkDownload(mockSongs), {
        wrapper: createWrapper(),
      });

      expect(result.current.progress).toEqual({ current: 0, total: 0 });
    });

    it("初期状態では error が null である", () => {
      const { result } = renderHook(() => useBulkDownload(mockSongs), {
        wrapper: createWrapper(),
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe("ダウンロード状態の計算", () => {
    it("全曲未ダウンロードの場合、status が 'none' である", async () => {
      mockOfflineService.isSongDownloaded.mockResolvedValue(false);

      const { result } = renderHook(() => useBulkDownload(mockSongs), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.status).toBe("none");
      });
    });

    it("一部ダウンロード済みの場合、status が 'partial' である", async () => {
      mockOfflineService.isSongDownloaded
        .mockResolvedValueOnce(true) // song1: downloaded
        .mockResolvedValueOnce(false) // song2: not downloaded
        .mockResolvedValueOnce(false); // song3: not downloaded

      const { result } = renderHook(() => useBulkDownload(mockSongs), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.status).toBe("partial");
      });
    });

    it("全曲ダウンロード済みの場合、status が 'all' である", async () => {
      mockOfflineService.isSongDownloaded.mockResolvedValue(true);

      const { result } = renderHook(() => useBulkDownload(mockSongs), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.status).toBe("all");
      });
    });

    it("ダウンロード済み曲数が正しく計算される", async () => {
      mockOfflineService.isSongDownloaded
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);

      const { result } = renderHook(() => useBulkDownload(mockSongs), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.downloadedCount).toBe(2);
        expect(result.current.totalCount).toBe(3);
      });
    });
  });

  describe("一括ダウンロード", () => {
    it("startDownload を呼ぶと未ダウンロード曲のダウンロードが開始される", async () => {
      // isSongDownloaded は初期チェックと startDownload 内の両方で呼ばれる
      // 各曲に対して一貫した結果を返すように実装
      mockOfflineService.isSongDownloaded.mockImplementation(
        async (songId: string) => {
          return songId === "song1"; // song1 のみダウンロード済み
        }
      );

      mockOfflineService.downloadSong.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useBulkDownload(mockSongs), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.status).toBe("partial");
      });

      await act(async () => {
        await result.current.startDownload();
      });

      // song1 は既にダウンロード済みなのでスキップ
      expect(mockOfflineService.downloadSong).toHaveBeenCalledTimes(2);
      expect(mockOfflineService.downloadSong).toHaveBeenCalledWith(
        mockSongs[1]
      );
      expect(mockOfflineService.downloadSong).toHaveBeenCalledWith(
        mockSongs[2]
      );
    });

    it("ダウンロード中は isDownloading が true になる", async () => {
      mockOfflineService.isSongDownloaded.mockResolvedValue(false);

      // ダウンロードを遅延させる
      mockOfflineService.downloadSong.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      );

      const { result } = renderHook(() => useBulkDownload(mockSongs), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.status).toBe("none");
      });

      act(() => {
        result.current.startDownload();
      });

      await waitFor(() => {
        expect(result.current.isDownloading).toBe(true);
      });

      await waitFor(
        () => {
          expect(result.current.isDownloading).toBe(false);
        },
        { timeout: 500 }
      );
    });

    it("ダウンロード中に progress が更新される", async () => {
      mockOfflineService.isSongDownloaded.mockResolvedValue(false);
      mockOfflineService.downloadSong.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useBulkDownload(mockSongs), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.status).toBe("none");
      });

      await act(async () => {
        await result.current.startDownload();
      });

      // 完了後は current === total
      expect(result.current.progress.current).toBe(3);
      expect(result.current.progress.total).toBe(3);
    });
  });

  describe("一括削除", () => {
    it("startDelete を呼ぶと全曲の削除が開始される", async () => {
      mockOfflineService.isSongDownloaded.mockResolvedValue(true);
      mockOfflineService.deleteSong.mockResolvedValue({ success: true });

      const { result } = renderHook(() => useBulkDownload(mockSongs), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.status).toBe("all");
      });

      await act(async () => {
        await result.current.startDelete();
      });

      expect(mockOfflineService.deleteSong).toHaveBeenCalledTimes(3);
      expect(mockOfflineService.deleteSong).toHaveBeenCalledWith("song1");
      expect(mockOfflineService.deleteSong).toHaveBeenCalledWith("song2");
      expect(mockOfflineService.deleteSong).toHaveBeenCalledWith("song3");
    });
  });

  describe("キャンセル", () => {
    it("cancel を呼ぶとダウンロードが中断される", async () => {
      mockOfflineService.isSongDownloaded.mockResolvedValue(false);

      let resolveDownload: (value: { success: boolean }) => void;
      mockOfflineService.downloadSong.mockImplementation(
        () =>
          new Promise((resolve) => {
            resolveDownload = resolve;
          })
      );

      const { result } = renderHook(() => useBulkDownload(mockSongs), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.status).toBe("none");
      });

      act(() => {
        result.current.startDownload();
      });

      await waitFor(() => {
        expect(result.current.isDownloading).toBe(true);
      });

      act(() => {
        result.current.cancel();
      });

      // キャンセル後は isDownloading が false になる
      await waitFor(() => {
        expect(result.current.isDownloading).toBe(false);
      });
    });
  });

  describe("エラーハンドリング", () => {
    it("ダウンロードに失敗した場合、error が設定される", async () => {
      mockOfflineService.isSongDownloaded.mockResolvedValue(false);
      mockOfflineService.downloadSong.mockResolvedValue({
        success: false,
        error: "Download failed",
      });

      const { result } = renderHook(() => useBulkDownload(mockSongs), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.status).toBe("none");
      });

      await act(async () => {
        await result.current.startDownload();
      });

      expect(result.current.error).toBe("一部の曲のダウンロードに失敗しました");
    });
  });

  describe("空のリスト", () => {
    it("曲リストが空の場合、status が 'all' である", async () => {
      const { result } = renderHook(() => useBulkDownload([]), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.status).toBe("all");
      });
    });
  });
});

