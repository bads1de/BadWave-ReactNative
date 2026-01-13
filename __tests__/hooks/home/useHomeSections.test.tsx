import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGetLocalTrendSongs } from "@/hooks/data/useGetLocalTrendSongs";
import { useGetLocalRecommendations } from "@/hooks/data/useGetLocalRecommendations";
import { useGetLocalSpotlights } from "@/hooks/data/useGetLocalSpotlights";
import { db } from "@/lib/db/client";

// モックの定義
jest.mock("@/lib/db/client", () => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
  };
  return {
    db: chain,
  };
});

jest.mock("@/lib/db/schema", () => ({
  songs: { id: "id", playCount: "playCount" },
  sectionCache: { key: "key", itemIds: "itemIds" },
  spotlights: { id: "id", createdAt: "createdAt" },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  inArray: jest.fn(),
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

describe("Home Section Local Hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("useGetLocalTrendSongs", () => {
    it("トレンド曲を取得できる", async () => {
      const mockIds = ["s1"];
      const mockSongs = [
        {
          id: "s1",
          userId: "u1",
          title: "Trend 1",
          author: "Artist 1",
          songPath: "path1",
          imagePath: "img1",
          playCount: 10,
          likeCount: 5,
          createdAt: "2023-01-01",
        },
      ];

      // 1回目の select (sectionCache)
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest
          .fn()
          .mockReturnValue(Promise.resolve([{ itemIds: mockIds }])),
      });

      // 2回目の select (songs)
      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnValue(Promise.resolve(mockSongs)),
      });

      const { result } = renderHook(() => useGetLocalTrendSongs("all"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.data?.length).toBe(1);
      expect(result.current.data?.[0].title).toBe("Trend 1");
    });
  });

  describe("useGetLocalRecommendations", () => {
    it("おすすめ曲を取得できる", async () => {
      const mockIds = ["s1"];
      const mockSongs = [{ id: "s1", title: "Rec 1" }];

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        limit: jest
          .fn()
          .mockReturnValue(Promise.resolve([{ itemIds: mockIds }])),
      });

      (db.select as jest.Mock).mockReturnValueOnce({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(Promise.resolve(mockSongs)),
      });

      const { result } = renderHook(() => useGetLocalRecommendations("u1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.data?.length).toBe(1);
      expect(result.current.data?.[0].title).toBe("Rec 1");
    });
  });

  describe("useGetLocalSpotlights", () => {
    it("スポットライトを取得できる", async () => {
      const mockSpots = [
        {
          id: "spot1",
          title: "Spotlight 1",
          author: "Author 1",
          videoPath: "v1",
          thumbnailPath: "t1",
          createdAt: "2023-01-01",
        },
      ];
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnValue(Promise.resolve(mockSpots)),
      });

      const { result } = renderHook(() => useGetLocalSpotlights(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.data?.length).toBe(1);
    });
  });
});

