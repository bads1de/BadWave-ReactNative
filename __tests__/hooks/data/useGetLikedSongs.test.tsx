import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGetLikedSongs } from "@/hooks/data/useGetLikedSongs";
import { db } from "@/lib/db/client";

// モック
jest.mock("@/lib/db/client", () => ({
  db: {
    select: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  songs: { id: "id" },
  likedSongs: { userId: "userId", songId: "songId", likedAt: "likedAt" },
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

describe("useGetLikedSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupMockChain = (resolvedValue: any) => {
    const mockWhere = jest.fn().mockResolvedValue(resolvedValue);
    const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere });
    const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin });
    (db.select as jest.Mock).mockReturnValue({ from: mockFrom });
  };

  it("ユーザーがいいねした曲をJOINして取得できる", async () => {
    const userId = "u1";
    const mockRows = [
      {
        likedAt: "2024-01-01",
        song: {
          id: "s1",
          userId: "u2",
          title: "Song 1",
          author: "Author 1",
          playCount: 10,
          likeCount: 5,
        },
      },
    ];

    setupMockChain(mockRows);

    const { result } = renderHook(() => useGetLikedSongs(userId), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false), {
      timeout: 3000,
    });

    expect(result.current.likedSongs.length).toBe(1);
    expect(result.current.likedSongs[0].id).toBe("s1");
    expect(result.current.likedSongs[0].count).toBe("10");
  });

  it("userIdがない場合は空配列を返し、DBクエリを実行しない", async () => {
    const { result } = renderHook(() => useGetLikedSongs(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.likedSongs).toEqual([]);
    expect(db.select).not.toHaveBeenCalled();
  });
});
