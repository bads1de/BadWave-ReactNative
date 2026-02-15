import { renderHook, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGetPlaylistSongs } from "@/hooks/data/useGetPlaylistSongs";
import { db } from "@/lib/db/client";

// モック
jest.mock("@/lib/db/client", () => ({
  db: {
    select: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  songs: { id: "id" },
  playlistSongs: {
    playlistId: "playlistId",
    songId: "songId",
    addedAt: "addedAt",
  },
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

describe("useGetPlaylistSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const setupMockChain = (resolvedValue: any) => {
    const mockWhere = jest.fn().mockResolvedValue(resolvedValue);
    const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere });
    const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin });
    (db.select as jest.Mock).mockReturnValue({ from: mockFrom });
  };

  it("プレイリスト内の曲をJOINして取得できる", async () => {
    const mockRows = [
      {
        addedAt: "2024-01-01",
        song: {
          id: "s1",
          userId: "u1",
          title: "Song 1",
          author: "Author 1",
          originalSongPath: "orig-song-path",
          originalImagePath: "orig-img-path",
          playCount: 10,
          likeCount: 5,
          createdAt: "2024-01-01",
        },
      },
    ];

    setupMockChain(mockRows);

    const { result } = renderHook(() => useGetPlaylistSongs("p1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false), {
      timeout: 3000,
    });

    expect(result.current.songs.length).toBe(1);
    expect(result.current.songs[0].id).toBe("s1");
    expect(result.current.songs[0].title).toBe("Song 1");
    expect(result.current.songs[0].count).toBe("10");
  });

  it("曲がない場合は空配列を返す", async () => {
    setupMockChain([]);

    const { result } = renderHook(() => useGetPlaylistSongs("p1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false), {
      timeout: 3000,
    });
    expect(result.current.songs).toEqual([]);
  });

  it("playlistId がない場合は空配列を返し、DBクエリを実行しない", async () => {
    const { result } = renderHook(() => useGetPlaylistSongs(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.songs).toEqual([]);
    expect(db.select).not.toHaveBeenCalled();
  });

  it("エラー発生時に error が設定される", async () => {
    const mockWhere = jest.fn().mockRejectedValue(new Error("DB Join Error"));
    const mockInnerJoin = jest.fn().mockReturnValue({ where: mockWhere });
    const mockFrom = jest.fn().mockReturnValue({ innerJoin: mockInnerJoin });
    (db.select as jest.Mock).mockReturnValue({ from: mockFrom });

    const { result } = renderHook(() => useGetPlaylistSongs("p1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false), {
      timeout: 3000,
    });
    expect(result.current.error).toBeDefined();
    expect(result.current.error?.message).toBe("DB Join Error");
  });
});
