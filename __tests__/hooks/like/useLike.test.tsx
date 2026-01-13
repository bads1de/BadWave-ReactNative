import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useLikeStatus } from "@/hooks/data/useLikeStatus";
import { useLikeMutation } from "@/hooks/mutations/useLikeMutation";
import { useGetLikedSongs } from "@/hooks/data/useGetLikedSongs";
import { db } from "@/lib/db/client";
import { supabase } from "@/lib/supabase";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";

// モックの定義
jest.mock("@/lib/supabase", () => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest
      .fn()
      .mockReturnValue(
        Promise.resolve({ data: { like_count: 0 }, error: null })
      ),
  };
  return {
    supabase: {
      from: jest.fn(() => chain),
      rpc: jest.fn(() => Promise.resolve({ data: null, error: null })),
    },
  };
});

jest.mock("@/lib/db/client", () => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    from: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    values: jest.fn().mockReturnThis(),
    query: {
      songs: {
        findFirst: jest.fn().mockResolvedValue({ likeCount: 0 }),
      },
      likedSongs: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    },
  };
  return {
    db: chain,
  };
});

jest.mock("@/lib/db/schema", () => ({
  likedSongs: { userId: "userId", songId: "songId", likedAt: "likedAt" },
  songs: { id: "id", likeCount: "likeCount" },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  and: jest.fn(),
  desc: jest.fn(),
}));

jest.mock("@/hooks/common/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(),
}));

// テスト用ラッパー
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, staleTime: 0 },
      mutations: { retry: false },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useLikeStatus", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ユーザーIDがない場合はfalseを返す", async () => {
    const { result } = renderHook(() => useLikeStatus("song-1", undefined), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isLiked).toBe(false);
  });

  it("いいね済みの曲はtrueを返す", async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue(Promise.resolve([{ id: 1 }])),
    });

    const { result } = renderHook(() => useLikeStatus("song-1", "user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLiked).toBe(true));
  });

  it("いいねしていない曲はfalseを返す", async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnValue(Promise.resolve([])),
    });

    const { result } = renderHook(() => useLikeStatus("song-1", "user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLiked).toBe(false));
  });
});

describe("useLikeMutation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
  });

  it("オフライン時はエラーを投げる", async () => {
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: false });
    const { result } = renderHook(() => useLikeMutation("song-1", "user-1"), {
      wrapper: createWrapper(),
    });

    let error: any;
    await act(async () => {
      try {
        await result.current.mutateAsync(false);
      } catch (e) {
        error = e;
      }
    });

    expect(error?.message).toBe("いいね機能にはインターネット接続が必要です");
  });

  it("いいねを追加できる", async () => {
    // チェーン可能なモックをセットアップ
    const chain = {
      select: jest.fn().mockReturnThis(),
      insert: jest.fn().mockReturnValue(Promise.resolve({ error: null })),
      delete: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest
        .fn()
        .mockReturnValue(
          Promise.resolve({ data: { like_count: 5 }, error: null })
        ),
    };
    (supabase.from as jest.Mock).mockReturnValue(chain);

    // DBモックのセットアップ
    (db.insert as jest.Mock).mockReturnThis();
    (db.values as jest.Mock).mockReturnValue(Promise.resolve({}));
    (db.update as jest.Mock).mockReturnThis();
    (db.set as jest.Mock).mockReturnThis();
    (db.where as jest.Mock).mockReturnValue(Promise.resolve({}));

    const { result } = renderHook(() => useLikeMutation("song-1", "user-1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.mutateAsync(false);
    });

    expect(db.insert).toHaveBeenCalled();
    expect(supabase.from).toHaveBeenCalledWith("liked_songs_regular");
  });
});

describe("useGetLikedSongs", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("ユーザーIDがない場合は空配列を返す", async () => {
    const { result } = renderHook(() => useGetLikedSongs(undefined), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.likedSongs).toEqual([]);
  });

  it("いいねした曲一覧を取得できる", async () => {
    const mockData = [
      {
        likedAt: "2023-01-01",
        song: {
          id: "song-1",
          userId: "user-1",
          title: "Song 1",
          author: "Artist 1",
          songPath: "path/1",
          imagePath: "img/1",
          playCount: 10,
          likeCount: 5,
          createdAt: "2023-01-01",
        },
      },
    ];

    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnThis(),
      innerJoin: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnValue(Promise.resolve(mockData)),
    });

    const { result } = renderHook(() => useGetLikedSongs("user-1"), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.likedSongs.length).toBe(1);
    expect(result.current.likedSongs[0].title).toBe("Song 1");
  });
});
