import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGetLocalTrendSongs } from "@/hooks/data/useGetLocalTrendSongs";
import { db } from "@/lib/db/client";

// モック
jest.mock("@/lib/db/client", () => ({
  db: {
    select: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  songs: { id: "id", playCount: "playCount" },
  sectionCache: { key: "key" },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  inArray: jest.fn(),
  desc: jest.fn(),
}));

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

describe("useGetLocalTrendSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("sectionCache からIDを取得し、対応する楽曲データを取得できる", async () => {
    // 1回目: sectionCache
    const mockCacheEntry = [{ itemIds: ["s1", "s2"] }];
    const mockLimit1 = jest.fn().mockResolvedValue(mockCacheEntry);
    const mockWhere1 = jest.fn().mockReturnValue({ limit: mockLimit1 });

    // 2回目: songs
    const mockSongs = [
      { id: "s1", title: "Song 1", playCount: 100 },
      { id: "s2", title: "Song 2", playCount: 50 },
    ];
    const mockOrderBy = jest.fn().mockResolvedValue(mockSongs);
    const mockWhere2 = jest.fn().mockReturnValue({ orderBy: mockOrderBy });

    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({ where: mockWhere1 }),
      }) // cache
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({ where: mockWhere2 }),
      }); // songs

    const { result } = renderHook(() => useGetLocalTrendSongs("day"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.length).toBe(2);
    expect(result.current.data?.[0].id).toBe("s1");
    expect(result.current.data?.[0].count).toBe("100");
  });

  it("キャッシュがない場合、空配列を返す", async () => {
    const mockLimit = jest.fn().mockResolvedValue([]);
    const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({ where: mockWhere }),
    });

    const { result } = renderHook(() => useGetLocalTrendSongs("all"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });
});
