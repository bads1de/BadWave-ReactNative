import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useSyncRecommendations } from "@/hooks/sync/useSyncRecommendations";
import { CACHED_QUERIES } from "@/constants";

// モック
jest.mock("@/lib/supabase", () => ({
  supabase: {
    rpc: jest.fn(),
  },
}));

jest.mock("@/lib/db/client", () => ({
  db: {
    insert: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  sectionCache: { key: "key" },
}));

const _supabase = require("@/lib/supabase").supabase;
const { db } = require("@/lib/db/client");

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useSyncRecommendations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("userIdがある場合、Supabase RPCを呼び出しSQLiteに保存し、キャッシュを無効化する", async () => {
    const userId = "u123";
    const mockSongs = [{ id: "s1" }, { id: "s2" }];

    // Supabase モック
    _supabase.rpc.mockResolvedValue({ data: mockSongs, error: null });

    // SQLite モック
    const mockOnConflictDoUpdate = jest.fn().mockResolvedValue(undefined);
    const mockValues = jest
      .fn()
      .mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
    db.insert.mockReturnValue({ values: mockValues });

    const queryClient = new QueryClient();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSyncRecommendations(userId), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSyncing).toBe(false), {
      timeout: 3000,
    });

    expect(result.current.syncedCount).toBe(2);
    expect(_supabase.rpc).toHaveBeenCalledWith("get_recommendations", {
      p_user_id: userId,
      p_limit: 10,
    });
    expect(db.insert).toHaveBeenCalled();

    // useEffect による invalidateQueries の確認
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [CACHED_QUERIES.getRecommendations, userId, "local"],
      });
    });
  });

  it("userIdがない場合、enabled: false となり同期されない", async () => {
    const { result } = renderHook(() => useSyncRecommendations(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.syncedCount).toBe(0);
    expect(_supabase.rpc).not.toHaveBeenCalled();
  });

  it("リモートデータが空の場合、syncedCount: 0 を返す", async () => {
    _supabase.rpc.mockResolvedValue({ data: [], error: null });

    const { result } = renderHook(() => useSyncRecommendations("u123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSyncing).toBe(false), {
      timeout: 3000,
    });
    expect(result.current.syncedCount).toBe(0);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("RPCエラー発生時に error が設定される", async () => {
    _supabase.rpc.mockResolvedValue({
      data: null,
      error: { message: "RPC Error" },
    });

    const { result } = renderHook(() => useSyncRecommendations("u123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSyncing).toBe(false), {
      timeout: 3000,
    });
    expect(result.current.syncError).toBeDefined();
    expect(result.current.syncError?.message).toBe("RPC Error");
  });
});
