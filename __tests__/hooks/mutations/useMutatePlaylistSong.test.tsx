import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useMutatePlaylistSong } from "@/hooks/mutations/useMutatePlaylistSong";
import { CACHED_QUERIES } from "@/constants";

// モック
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("@/lib/db/client", () => ({
  db: {
    insert: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  playlistSongs: {
    playlistId: "playlistId",
    songId: "songId",
  },
}));

jest.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(),
}));

jest.mock("@/lib/utils/retry", () => ({
  withSupabaseRetry: jest.fn((_fn) => _fn()),
}));

const { db } = require("@/lib/db/client");
const { useNetworkStatus } = require("@/hooks/useNetworkStatus");
const { withSupabaseRetry } = require("@/lib/utils/retry");

describe("useMutatePlaylistSong - Optimistic Update", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    useNetworkStatus.mockReturnValue({ isOnline: true });
  });

  afterEach(() => {
    queryClient.clear();
  });

  describe("addSong - 楽観的更新", () => {
    it("addSong時に即座にキャッシュが更新される（楽観的更新）", async () => {
      // 初期状態: プレイリストに曲がない
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistSongs, "playlist-1"],
        []
      );

      // Supabaseモック
      withSupabaseRetry.mockImplementation(async (_fn: () => Promise<any>) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { data: null, error: null };
      });

      db.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      const { result } = renderHook(() => useMutatePlaylistSong("user-1"), {
        wrapper: createWrapper(),
      });

      // addSong を呼び出し
      act(() => {
        result.current.addSong.mutate({
          songId: "song-1",
          playlistId: "playlist-1",
        });
      });

      // 楽観的更新: 即座に曲がキャッシュに追加される
      await waitFor(() => {
        const cachedSongs = queryClient.getQueryData<any[]>([
          CACHED_QUERIES.playlistSongs,
          "playlist-1",
        ]);
        expect(cachedSongs?.length).toBe(1);
        expect(cachedSongs?.[0].songId).toBe("song-1");
      });
    });

    it("addSongエラー時にキャッシュがロールバックされる", async () => {
      // 初期状態
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistSongs, "playlist-1"],
        []
      );

      // Supabaseモック（エラー）
      withSupabaseRetry.mockImplementation(async () => {
        return { data: null, error: { message: "Error" } };
      });

      const { result } = renderHook(() => useMutatePlaylistSong("user-1"), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.addSong.mutate({
          songId: "song-1",
          playlistId: "playlist-1",
        });
      });

      // ロールバック: 元の空配列に戻る
      await waitFor(() => {
        const cachedSongs = queryClient.getQueryData<any[]>([
          CACHED_QUERIES.playlistSongs,
          "playlist-1",
        ]);
        expect(cachedSongs?.length).toBe(0);
      });
    });
  });

  describe("removeSong - 楽観的更新", () => {
    it("removeSong時に即座にキャッシュから曲が削除される（楽観的更新）", async () => {
      // 初期状態: プレイリストに曲がある
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistSongs, "playlist-1"],
        [
          { id: "ps-1", songId: "song-1", playlistId: "playlist-1" },
          { id: "ps-2", songId: "song-2", playlistId: "playlist-1" },
        ]
      );

      // Supabaseモック
      withSupabaseRetry.mockImplementation(async (_fn: () => Promise<any>) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { data: null, error: null };
      });

      db.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      const { result } = renderHook(() => useMutatePlaylistSong("user-1"), {
        wrapper: createWrapper(),
      });

      // removeSong を呼び出し
      act(() => {
        result.current.removeSong.mutate({
          songId: "song-1",
          playlistId: "playlist-1",
        });
      });

      // 楽観的更新: 即座に曲がキャッシュから削除される
      await waitFor(() => {
        const cachedSongs = queryClient.getQueryData<any[]>([
          CACHED_QUERIES.playlistSongs,
          "playlist-1",
        ]);
        expect(cachedSongs?.length).toBe(1);
        expect(cachedSongs?.[0].songId).toBe("song-2");
      });
    });

    it("removeSongエラー時にキャッシュがロールバックされる", async () => {
      // 初期状態
      const initialSongs = [
        { id: "ps-1", songId: "song-1", playlistId: "playlist-1" },
      ];
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistSongs, "playlist-1"],
        initialSongs
      );

      // Supabaseモック（エラー）
      withSupabaseRetry.mockImplementation(async () => {
        return { data: null, error: { message: "Error" } };
      });

      const { result } = renderHook(() => useMutatePlaylistSong("user-1"), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.removeSong.mutate({
          songId: "song-1",
          playlistId: "playlist-1",
        });
      });

      // ロールバック: 元の状態に戻る
      await waitFor(() => {
        const cachedSongs = queryClient.getQueryData<any[]>([
          CACHED_QUERIES.playlistSongs,
          "playlist-1",
        ]);
        expect(cachedSongs?.length).toBe(1);
        expect(cachedSongs?.[0].songId).toBe("song-1");
      });
    });
  });
});
