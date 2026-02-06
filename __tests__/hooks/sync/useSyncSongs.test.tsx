import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useSyncSongs } from "@/hooks/sync/useSyncSongs";

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
  songs: {
    id: "id",
  },
}));

jest.mock("drizzle-orm", () => ({
  sql: jest.fn((strings) => strings[0]),
}));

const { supabase } = require("@/lib/supabase");
const { db } = require("@/lib/db/client");
const { songs } = require("@/lib/db/schema");

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

describe("useSyncSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should handle empty remote data", async () => {
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });
    supabase.from = mockFrom;

    const { result } = renderHook(() => useSyncSongs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });

    expect(result.current.syncedCount).toBe(0);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("should sync remote songs to local db", async () => {
    const mockRemoteSongs = [
      { id: "1", user_id: "u1", title: "Song 1", author: "A1", song_path: "s1", image_path: "i1", created_at: "2024-01-01" },
      { id: "2", user_id: "u1", title: "Song 2", author: "A2", song_path: "s2", image_path: "i2", created_at: "2024-01-02" },
    ];

    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: mockRemoteSongs,
          error: null,
        }),
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

    const { result } = renderHook(() => useSyncSongs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });

    expect(supabase.from).toHaveBeenCalledWith("songs");
    expect(db.insert).toHaveBeenCalledWith(songs);
    expect(mockValues).toHaveBeenCalled();
    expect(result.current.syncedCount).toBe(2);
  });

  it("should handle supabase error", async () => {
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        order: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Supabase error" },
        }),
      }),
    });
    supabase.from = mockFrom;

    const { result } = renderHook(() => useSyncSongs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });

    expect(result.current.syncError).toBeDefined();
    expect(result.current.syncError?.message).toBe("Supabase error");
  });
});
