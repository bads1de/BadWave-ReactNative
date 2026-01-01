import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { renderHook, waitFor, act } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useGetPlaylists } from "@/hooks/data/useGetPlaylists";
import { useGetPlaylistSongs } from "@/hooks/data/useGetPlaylistSongs";
import { useMutatePlaylistSong } from "@/hooks/mutations/useMutatePlaylistSong";
import { useCreatePlaylist } from "@/hooks/mutations/useCreatePlaylist";
import { db } from "@/lib/db/client";
import { supabase } from "@/lib/supabase";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

// モックの定義
jest.mock("@/lib/supabase", () => {
  const chain = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
  };
  return {
    supabase: {
      from: jest.fn(() => chain),
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
  };
  return {
    db: chain,
  };
});

jest.mock("@/lib/db/schema", () => ({
  playlists: { id: "id", userId: "userId", title: "title" },
  playlistSongs: { id: "id", playlistId: "playlistId", songId: "songId" },
  songs: { id: "id" },
}));

jest.mock("drizzle-orm", () => ({
  eq: jest.fn(),
  and: jest.fn(),
  desc: jest.fn(),
}));

jest.mock("@/hooks/useNetworkStatus", () => ({
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

describe("Playlist Hooks", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useNetworkStatus as jest.Mock).mockReturnValue({ isOnline: true });
  });

  describe("useGetPlaylists", () => {
    it("プレイリスト一覧を取得できる", async () => {
      const mockPlaylists = [{ id: "p1", title: "Playlist 1" }];
      // Final call in chain should return Promise
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(Promise.resolve(mockPlaylists)),
      });

      const { result } = renderHook(() => useGetPlaylists("u1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.playlists.length).toBe(1);
      expect(result.current.playlists[0].title).toBe("Playlist 1");
    });
  });

  describe("useGetPlaylistSongs", () => {
    it("プレイリスト内の曲一覧を取得できる", async () => {
      const mockSongs = [
        {
          song: {
            id: "s1",
            title: "Song 1",
            author: "A1",
            songPath: "path",
            imagePath: "img",
          },
        },
      ];
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnValue(Promise.resolve(mockSongs)),
      });

      const { result } = renderHook(() => useGetPlaylistSongs("p1"), {
        wrapper: createWrapper(),
      });

      await waitFor(() => expect(result.current.isLoading).toBe(false));
      expect(result.current.songs.length).toBe(1);
    });
  });

  describe("useCreatePlaylist", () => {
    it("新しいプレイリストを作成できる", async () => {
      const mockPlaylist = { id: "pnew", title: "New", created_at: "now" };
      (supabase.from as jest.Mock).mockReturnValue({
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest
          .fn()
          .mockReturnValue(
            Promise.resolve({ data: mockPlaylist, error: null })
          ),
      });
      (db.insert as jest.Mock).mockReturnThis();
      (db.values as jest.Mock).mockReturnValue(Promise.resolve({}));

      const { result } = renderHook(() => useCreatePlaylist("u1"), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({ title: "New" });
      });

      expect(db.insert).toHaveBeenCalled();
      expect(supabase.from).toHaveBeenCalledWith("playlists");
    });
  });

  describe("useMutatePlaylistSong", () => {
    it("プレイリストに曲を追加できる", async () => {
      const mockChain = {
        insert: jest.fn().mockReturnValue(Promise.resolve({ error: null })),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockChain);
      (db.insert as jest.Mock).mockReturnThis();
      (db.values as jest.Mock).mockReturnValue(Promise.resolve({}));

      // useMutatePlaylistSong should be called with a userId for the mutations to work
      const { result } = renderHook(() => useMutatePlaylistSong("u1"), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.addSong.mutateAsync({
          songId: "s1",
          playlistId: "p1",
        });
      });

      expect(db.insert).toHaveBeenCalled();
      expect(mockChain.insert).toHaveBeenCalled();
    });
  });
});
