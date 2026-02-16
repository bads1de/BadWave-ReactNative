import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGetLocalRecommendations } from "@/hooks/data/useGetLocalRecommendations";
import { db } from "@/lib/db/client";

// モック
jest.mock("@/lib/db/client", () => ({
  db: {
    select: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  songs: { id: "id" },
  sectionCache: { key: "key" },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  inArray: jest.fn(),
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

describe("useGetLocalRecommendations", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupMockChain = (resolvedValue: any) => {
    const mockLimit = jest.fn().mockResolvedValue(resolvedValue);
    const mockWhereCache = jest.fn().mockReturnValue({ limit: mockLimit });

    const mockWhereSongs = jest.fn().mockResolvedValue([]); // default

    (db.select as jest.Mock).mockReturnValueOnce({
      from: jest.fn().mockReturnValue({ where: mockWhereCache }),
    });
  };

  it("userIdがある場合、キャッシュ経由で楽曲データを取得できる", async () => {
    const userId = "u123";
    const cacheResult = [{ itemIds: ["s1"] }];
    const mockLimit = jest.fn().mockResolvedValue(cacheResult);
    const mockWhereCache = jest.fn().mockReturnValue({ limit: mockLimit });

    const mockSongs = [{ id: "s1", title: "Rec Song", playCount: 5 }];
    const mockWhereSongs = jest.fn().mockResolvedValue(mockSongs);

    (db.select as jest.Mock)
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({ where: mockWhereCache }),
      })
      .mockReturnValueOnce({
        from: jest.fn().mockReturnValue({ where: mockWhereSongs }),
      });

    const { result } = renderHook(() => useGetLocalRecommendations(userId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data?.length).toBe(1);
    expect(result.current.data?.[0].id).toBe("s1");
  });

  it("userIdがない場合、undefinedを返し、クエリを実行しない", async () => {
    const { result } = renderHook(() => useGetLocalRecommendations(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(db.select).not.toHaveBeenCalled();
  });

  it("リモートデータが空の場合、空配列を返す", async () => {
    const mockLimit = jest.fn().mockResolvedValue([]);
    const mockWhereCache = jest.fn().mockReturnValue({ limit: mockLimit });
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({ where: mockWhereCache }),
    });

    const { result } = renderHook(() => useGetLocalRecommendations("u123"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toEqual([]);
  });
});
