import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGetLocalSongs } from "@/hooks/data/useGetLocalSongs";
import { db } from "@/lib/db/client";

// モックの定義
jest.mock("@/lib/db/client", () => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
  };
  return {
    db: chain,
  };
});

jest.mock("@/lib/db/schema", () => ({
  songs: { id: "id" },
}));

jest.mock("drizzle-orm", () => ({
  desc: jest.fn(),
}));

// テスト用ラッパー
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useGetLocalSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("全ての曲をSQLiteから取得できる", async () => {
    const mockSongs = [
      {
        id: "s1",
        userId: "u1",
        title: "Song 1",
        author: "A1",
        songPath: "path1",
        imagePath: "img1",
        playCount: 10,
        likeCount: 5,
        createdAt: "2023-01-01",
      },
    ];

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnValue(Promise.resolve(mockSongs)),
    });

    const { result } = renderHook(() => useGetLocalSongs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.data?.length).toBe(1);
    expect(result.current.data?.[0].id).toBe("s1");
    expect(result.current.data?.[0].count).toBe("10"); // String conversion check
  });
});
