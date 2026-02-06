import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useSyncTrendSongs } from "@/hooks/sync/useSyncTrendSongs";

// モック
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("@/lib/db/client", () => ({
  db: {
    insert: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  sectionCache: {
    key: "key",
  },
}));

const { supabase } = require("@/lib/supabase");
const { db } = require("@/lib/db/client");
const { sectionCache } = require("@/lib/db/schema");

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

describe("useSyncTrendSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should sync trend songs to section cache", async () => {
    const mockTrendData = [{ id: "song-1" }, { id: "song-2" }];
    
    const mockLimit = jest.fn().mockResolvedValue({
      data: mockTrendData,
      error: null,
    });
    const mockOrder = jest.fn().mockReturnValue({
      limit: mockLimit,
    });
    const mockGte = jest.fn().mockReturnValue({
      order: mockOrder,
    });
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        gte: mockGte,
        order: mockOrder,
      }),
    });
    supabase.from = mockFrom;

    const mockOnConflictDoUpdate = jest.fn().mockResolvedValue(undefined);
    const mockValues = jest.fn().mockReturnValue({
      onConflictDoUpdate: mockOnConflictDoUpdate,
    });
    db.insert.mockReturnValue({
      values: mockValues,
    });

    const { result } = renderHook(() => useSyncTrendSongs("week"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });

    expect(supabase.from).toHaveBeenCalledWith("songs");
    expect(db.insert).toHaveBeenCalledWith(sectionCache);
    expect(mockValues).toHaveBeenCalledWith(expect.objectContaining({
      key: "trend_week",
      itemIds: ["song-1", "song-2"],
    }));
    expect(result.current.syncedCount).toBe(2);
  });

  it("should handle empty remote data", async () => {
    const mockLimit = jest.fn().mockResolvedValue({
      data: [],
      error: null,
    });
    const mockOrder = jest.fn().mockReturnValue({
      limit: mockLimit,
    });
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: mockOrder,
      }),
    });
    supabase.from = mockFrom;

    const { result } = renderHook(() => useSyncTrendSongs("all"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });

    expect(result.current.syncedCount).toBe(0);
    expect(db.insert).not.toHaveBeenCalled();
  });
});
