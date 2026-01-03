import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useSyncLikedSongs } from "@/hooks/sync/useSyncLikedSongs";

// モック
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("@/lib/db/client", () => ({
  db: {
    delete: jest.fn(),
    insert: jest.fn(),
    transaction: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  likedSongs: {
    userId: "userId",
    songId: "songId",
  },
}));

const { supabase } = require("@/lib/supabase");
const { db } = require("@/lib/db/client");

// テスト用のラッパー
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

describe("useSyncLikedSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not sync when userId is undefined", async () => {
    const { result } = renderHook(() => useSyncLikedSongs(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.syncedCount).toBe(0);
    expect(result.current.isSyncing).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("should handle empty remote data", async () => {
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });
    supabase.from = mockFrom;

    const mockTransaction = jest.fn().mockImplementation(async (callback) => {
      const tx = {
        delete: jest.fn().mockReturnValue({
          where: jest.fn().mockResolvedValue(undefined),
        }),
      };
      await callback(tx);
    });
    db.transaction = mockTransaction;

    const { result } = renderHook(() => useSyncLikedSongs("user-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });

    expect(result.current.syncedCount).toBe(0);
    expect(mockTransaction).toHaveBeenCalled();
  });

  it("should sync remote data using transaction and upsert", async () => {
    const mockRemoteLikes = [
      { song_id: "song-1", created_at: "2024-01-01T00:00:00Z" },
      { song_id: "song-2", created_at: "2024-01-02T00:00:00Z" },
    ];

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockRemoteLikes,
          error: null,
        }),
      }),
    });
    supabase.from = mockFrom;

    const mockInsert = jest.fn().mockReturnValue({
      values: jest.fn().mockReturnValue({
        onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
      }),
    });
    const mockDelete = jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });

    const mockTransaction = jest.fn().mockImplementation(async (callback) => {
      const tx = {
        insert: mockInsert,
        delete: mockDelete,
      };
      await callback(tx);
    });
    db.transaction = mockTransaction;

    const { result } = renderHook(() => useSyncLikedSongs("user-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });

    // トランザクションが使用されたことを確認
    expect(mockTransaction).toHaveBeenCalled();

    // Upsertが各曲に対して呼ばれたことを確認
    expect(mockInsert).toHaveBeenCalledTimes(2);

    // 差分削除が呼ばれたことを確認
    expect(mockDelete).toHaveBeenCalled();

    expect(result.current.syncedCount).toBe(2);
  });

  it("should handle supabase error", async () => {
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Network error" },
        }),
      }),
    });
    supabase.from = mockFrom;

    const { result } = renderHook(() => useSyncLikedSongs("user-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });

    expect(result.current.syncError).toBeDefined();
    expect(db.transaction).not.toHaveBeenCalled();
  });

  it("should rollback on transaction error", async () => {
    const mockRemoteLikes = [
      { song_id: "song-1", created_at: "2024-01-01T00:00:00Z" },
    ];

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockRemoteLikes,
          error: null,
        }),
      }),
    });
    supabase.from = mockFrom;

    // トランザクション内でエラーを発生させる
    const mockTransaction = jest.fn().mockImplementation(async (callback) => {
      const tx = {
        insert: jest.fn().mockReturnValue({
          values: jest.fn().mockReturnValue({
            onConflictDoUpdate: jest
              .fn()
              .mockRejectedValue(new Error("DB Error")),
          }),
        }),
        delete: jest.fn(),
      };
      await callback(tx);
    });
    db.transaction = mockTransaction;

    const { result } = renderHook(() => useSyncLikedSongs("user-123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });

    // エラーが発生していることを確認（トランザクションがロールバックされる）
    expect(result.current.syncError).toBeDefined();
  });
});
