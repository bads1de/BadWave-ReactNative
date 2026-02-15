import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useSyncSpotlights } from "@/hooks/sync/useSyncSpotlights";
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
  },
}));

jest.mock("@/lib/db/schema", () => ({
  spotlights: { id: "id" },
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
  return ({
    children,
    client = queryClient,
  }: {
    children: React.ReactNode;
    client?: QueryClient;
  }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe("useSyncSpotlights", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Supabaseから取得し、SQLiteにUpsertし、キャッシュを無効化する", async () => {
    const mockSpotlights = [
      {
        id: "sp1",
        title: "Spotlight 1",
        author: "Author 1",
        description: "Desc 1",
        genre: "Pop",
        video_path: "video-path",
        thumbnail_path: "thumb-path",
        created_at: "2024-01-01",
      },
    ];

    // Supabase モック
    const mockOrder = jest
      .fn()
      .mockResolvedValue({ data: mockSpotlights, error: null });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    _supabase.from.mockReturnValue({ select: mockSelect });

    // SQLite モック
    const mockOnConflictDoUpdate = jest.fn().mockResolvedValue(undefined);
    const mockValues = jest
      .fn()
      .mockReturnValue({ onConflictDoUpdate: mockOnConflictDoUpdate });
    db.insert.mockReturnValue({ values: mockValues });

    const queryClient = new QueryClient();
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");

    const { result } = renderHook(() => useSyncSpotlights(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      ),
    });

    await waitFor(() => expect(result.current.isSyncing).toBe(false), {
      timeout: 3000,
    });

    expect(result.current.syncedCount).toBe(1);
    expect(_supabase.from).toHaveBeenCalledWith("spotlights");
    expect(db.insert).toHaveBeenCalled();
    expect(mockOnConflictDoUpdate).toHaveBeenCalled();

    // useEffect による invalidateQueries の確認
    await waitFor(() => {
      expect(invalidateSpy).toHaveBeenCalledWith({
        queryKey: [CACHED_QUERIES.spotlights, "local"],
      });
    });
  });

  it("リモートデータが空の場合、syncedCount: 0 を返す", async () => {
    const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    _supabase.from.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useSyncSpotlights(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSyncing).toBe(false), {
      timeout: 3000,
    });
    expect(result.current.syncedCount).toBe(0);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("Supabaseエラー発生時に error が設定される", async () => {
    const mockOrder = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: "Supabase Error" } });
    const mockSelect = jest.fn().mockReturnValue({ order: mockOrder });
    _supabase.from.mockReturnValue({ select: mockSelect });

    const { result } = renderHook(() => useSyncSpotlights(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSyncing).toBe(false), {
      timeout: 3000,
    });
    expect(result.current.syncError).toBeDefined();
    expect(result.current.syncError?.message).toBe("Supabase Error");
  });
});
