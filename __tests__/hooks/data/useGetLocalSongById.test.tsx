import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGetLocalSongById } from "@/hooks/data/useGetLocalSongById";
import { db } from "@/lib/db/client";

// モック
jest.mock("@/lib/db/client", () => ({
  db: {
    select: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  songs: { id: "id" },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
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

describe("useGetLocalSongById", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupMockChain = (resolvedValue: any) => {
    const mockLimit = jest.fn().mockResolvedValue(resolvedValue);
    const mockWhere = jest.fn().mockReturnValue({ limit: mockLimit });
    const mockFrom = jest.fn().mockReturnValue({ where: mockWhere });
    (db.select as jest.Mock).mockReturnValue({ from: mockFrom });
  };

  it("楽曲IDに基づきSQLiteから楽曲データを取得できる", async () => {
    const mockSong = {
      id: "s1",
      userId: "u1",
      title: "Title",
      author: "Author",
      originalSongPath: "orig-path",
      playCount: 5,
      createdAt: "2024-01-01",
    };

    setupMockChain([mockSong]);

    const { result } = renderHook(() => useGetLocalSongById("s1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.data).toEqual(
      expect.objectContaining({
        id: "s1",
        title: "Title",
        count: "5",
      }),
    );
  });

  it("見つからない場合は null を返す", async () => {
    setupMockChain([]);

    const { result } = renderHook(() => useGetLocalSongById("none"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data).toBeNull();
  });

  it("songId がない場合は undefined を返し、クエリを実行しない", async () => {
    const { result } = renderHook(() => useGetLocalSongById(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(db.select).not.toHaveBeenCalled();
  });
});
