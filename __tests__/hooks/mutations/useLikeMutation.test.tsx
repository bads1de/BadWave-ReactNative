import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useLikeMutation } from "@/hooks/mutations/useLikeMutation";
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
    update: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  likedSongs: {
    userId: "userId",
    songId: "songId",
  },
  songs: {
    id: "id",
  },
}));

jest.mock("@/hooks/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(),
}));

jest.mock("@/lib/utils/retry", () => ({
  withSupabaseRetry: jest.fn((fn) => fn()),
}));

const _supabase = require("@/lib/supabase").supabase;
const { db } = require("@/lib/db/client");
const { useNetworkStatus } = require("@/hooks/useNetworkStatus");
const { withSupabaseRetry } = require("@/lib/utils/retry");

describe("useLikeMutation - Optimistic Update", () => {
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

  describe("楽観的更新", () => {
    it("mutate呼び出し時に即座にキャッシュが更新される（楽観的更新）", async () => {
      // 初期状態: いいねしていない
      queryClient.setQueryData(
        [CACHED_QUERIES.likedSongs, "status", "song-1", "user-1"],
        false
      );

      // Supabaseモック（時間がかかる）
      withSupabaseRetry.mockImplementation(async (_fn: () => Promise<any>) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { data: null, error: null };
      });

      db.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      const { result } = renderHook(() => useLikeMutation("song-1", "user-1"), {
        wrapper: createWrapper(),
      });

      // mutate を呼び出し
      act(() => {
        result.current.mutate(false); // 現在いいねしていない → いいねする
      });

      // 楽観的更新: 即座にキャッシュが true に更新される
      await waitFor(() => {
        const cachedStatus = queryClient.getQueryData([
          CACHED_QUERIES.likedSongs,
          "status",
          "song-1",
          "user-1",
        ]);
        expect(cachedStatus).toBe(true);
      });
    });

    it("エラー時にキャッシュが元の状態にロールバックされる", async () => {
      // 初期状態: いいねしていない
      queryClient.setQueryData(
        [CACHED_QUERIES.likedSongs, "status", "song-1", "user-1"],
        false
      );

      // Supabaseモック（エラーを返す）
      withSupabaseRetry.mockImplementation(async () => {
        return { data: null, error: { message: "Network error" } };
      });

      const { result } = renderHook(() => useLikeMutation("song-1", "user-1"), {
        wrapper: createWrapper(),
      });

      // mutate を呼び出し
      await act(async () => {
        result.current.mutate(false);
      });

      // エラー後: キャッシュが元の false にロールバック
      await waitFor(() => {
        const cachedStatus = queryClient.getQueryData([
          CACHED_QUERIES.likedSongs,
          "status",
          "song-1",
          "user-1",
        ]);
        expect(cachedStatus).toBe(false);
      });
    });

    it("いいね解除時も楽観的更新が機能する", async () => {
      // 初期状態: いいね済み
      queryClient.setQueryData(
        [CACHED_QUERIES.likedSongs, "status", "song-1", "user-1"],
        true
      );

      // Supabaseモック
      withSupabaseRetry.mockImplementation(async (_fn: () => Promise<any>) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { data: null, error: null };
      });

      db.delete.mockReturnValue({
        where: jest.fn().mockResolvedValue(undefined),
      });

      const { result } = renderHook(() => useLikeMutation("song-1", "user-1"), {
        wrapper: createWrapper(),
      });

      // mutate を呼び出し
      act(() => {
        result.current.mutate(true); // 現在いいね済み → 解除
      });

      // 楽観的更新: 即座にキャッシュが false に更新される
      await waitFor(() => {
        const cachedStatus = queryClient.getQueryData([
          CACHED_QUERIES.likedSongs,
          "status",
          "song-1",
          "user-1",
        ]);
        expect(cachedStatus).toBe(false);
      });
    });

    it("onMutateで既存のクエリがキャンセルされる", async () => {
      const cancelQueriesSpy = jest.spyOn(queryClient, "cancelQueries");

      queryClient.setQueryData(
        [CACHED_QUERIES.likedSongs, "status", "song-1", "user-1"],
        false
      );

      withSupabaseRetry.mockImplementation(async () => {
        return { data: null, error: null };
      });

      db.insert.mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      const { result } = renderHook(() => useLikeMutation("song-1", "user-1"), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        result.current.mutate(false);
      });

      // cancelQueriesが呼ばれたことを確認
      expect(cancelQueriesSpy).toHaveBeenCalled();
    });
  });
});
