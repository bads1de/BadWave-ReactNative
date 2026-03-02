import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useSyncPlaylists } from "@/hooks/sync/useSyncPlaylists";

// モック
jest.mock("@/lib/supabase", () => ({
  supabase: {
    from: jest.fn(),
  },
}));

jest.mock("@/lib/db/client", () => ({
  db: {
    insert: jest.fn(),
    transaction: jest.fn(),
  },
}));

jest.mock("@/lib/db/schema", () => ({
  playlists: {
    id: "id",
    userId: "userId",
  },
  playlistSongs: {
    id: "id",
    playlistId: "playlistId",
    songId: "songId",
  },
}));

const { supabase } = require("@/lib/supabase");
const { db } = require("@/lib/db/client");

// テスト用のラッパー
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe("useSyncPlaylists", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should not sync when userId is undefined", async () => {
    const { result } = renderHook(() => useSyncPlaylists(undefined), {
      wrapper: createWrapper(),
    });

    expect(result.current.syncedCount).toBe(0);
    expect(result.current.isSyncing).toBe(false);
    expect(supabase.from).not.toHaveBeenCalled();
  });

  it("should handle empty remote playlists", async () => {
    const mockFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }),
    });
    supabase.from = mockFrom;

    const { result } = renderHook(() => useSyncPlaylists("user-123"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.triggerSync();
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });

    expect(result.current.syncedCount).toBe(0);
  });

  it("should sync playlists with upsert and transaction for playlist songs", async () => {
    const mockRemoteSongs = [
      {
        id: "ps-1",
        playlist_id: "playlist-1",
        song_id: "song-1",
        created_at: "2024-01-01T00:00:00Z",
      },
      {
        id: "ps-2",
        playlist_id: "playlist-1",
        song_id: "song-2",
        created_at: "2024-01-02T00:00:00Z",
      },
    ];

    const mockRemotePlaylists = [
      {
        id: "playlist-1",
        user_id: "user-123",
        title: "My Playlist",
        image_path: "/path/to/image",
        is_public: false,
        created_at: "2024-01-01T00:00:00Z",
        playlist_songs: mockRemoteSongs,
      },
    ];

    // プレイリスト取得のモック
    const mockPlaylistsFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockRemotePlaylists,
          error: null,
        }),
      }),
    });

    // プレイリスト曲取得のモック
    const mockSongsFrom = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: mockRemoteSongs,
          error: null,
        }),
      }),
    });

    // fromの呼び出し順序に応じてモックを切り替え
    let callCount = 0;
    supabase.from = jest.fn().mockImplementation((table: string) => {
      if (table === "playlists") {
        return mockPlaylistsFrom();
      }
      if (table === "playlist_songs") {
        return mockSongsFrom();
      }
      return {};
    });

    const mockInsert = jest.fn().mockImplementation((table) => {
      return {
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
        }),
      };
    });

    const mockDelete = jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });

    const mockTransaction = jest.fn().mockImplementation(async (callback) => {
      const tx = {
        insert: mockInsert,
        delete: mockDelete,
      };
      await callback(tx);
    });
    db.transaction = mockTransaction;

    const { result } = renderHook(() => useSyncPlaylists("user-123"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.triggerSync();
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });

    if (result.current.syncError) {
      console.log("SYNC ERROR:", result.current.syncError);
    }

    // プレイリストのUpsertが呼ばれたことを確認 (トランザクション内のinsert)
    expect(mockInsert).toHaveBeenCalledWith(expect.anything()); // mockInsert called for playlists and songs

    // トランザクションが使用されたことを確認
    expect(mockTransaction).toHaveBeenCalled();

    // 曲のUpsert用とプレイリストのUpsert用、それぞれで計2回 mockInsert が呼ばれたことを確認
    expect(mockInsert).toHaveBeenCalledTimes(2);

    // 差分削除が呼ばれたことを確認
    expect(mockDelete).toHaveBeenCalled();

    expect(result.current.syncedCount).toBe(1);
  });

  it("should handle playlist with no songs", async () => {
    const mockRemotePlaylists = [
      {
        id: "playlist-1",
        user_id: "user-123",
        title: "Empty Playlist",
        image_path: null,
        is_public: false,
        created_at: "2024-01-01T00:00:00Z",
        playlist_songs: [],
      },
    ];

    supabase.from = jest.fn().mockImplementation((table: string) => {
      if (table === "playlists") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: mockRemotePlaylists,
              error: null,
            }),
          }),
        };
      }
      if (table === "playlist_songs") {
        return {
          select: jest.fn().mockReturnValue({
            eq: jest.fn().mockResolvedValue({
              data: [],
              error: null,
            }),
          }),
        };
      }
      return {};
    });

    const mockInsert = jest.fn().mockImplementation((table) => {
      return {
        values: jest.fn().mockReturnValue({
          onConflictDoUpdate: jest.fn().mockResolvedValue(undefined),
        }),
      };
    });

    const mockDelete = jest.fn().mockReturnValue({
      where: jest.fn().mockResolvedValue(undefined),
    });

    const mockTransaction = jest.fn().mockImplementation(async (callback) => {
      const tx = {
        insert: mockInsert,
        delete: mockDelete,
      };
      await callback(tx);
    });
    db.transaction = mockTransaction;

    const { result } = renderHook(() => useSyncPlaylists("user-123"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.triggerSync();
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });

    // 空のプレイリストでもトランザクションが呼ばれ、削除処理が行われることを確認
    expect(mockTransaction).toHaveBeenCalled();
    expect(mockDelete).toHaveBeenCalled();
    expect(result.current.syncedCount).toBe(1);
  });

  it("should handle supabase error for playlists", async () => {
    supabase.from = jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Network error" },
        }),
      }),
    });

    const { result } = renderHook(() => useSyncPlaylists("user-123"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.triggerSync();
    });

    await waitFor(() => {
      expect(result.current.isSyncing).toBe(false);
    });

    expect(result.current.syncError).toBeDefined();
  });
});
