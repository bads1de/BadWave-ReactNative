import { renderHook, act, waitFor } from "@testing-library/react-native";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import { useMutatePlaylist } from "@/hooks/mutations/useMutatePlaylist";
import { CACHED_QUERIES } from "@/constants";
import { AUTH_ERRORS, PLAYLIST_ERRORS } from "@/constants/errorMessages";

jest.mock("@/hooks/common/useNetworkStatus", () => ({
  useNetworkStatus: jest.fn(),
}));
jest.mock("@/actions/playlist/deletePlaylist", () => jest.fn());
jest.mock("@/actions/playlist/renamePlaylist", () => jest.fn());
jest.mock("@/actions/playlist/togglePublicPlaylist", () => jest.fn());

const { useNetworkStatus } = require("@/hooks/common/useNetworkStatus");
const deletePlaylist = require("@/actions/playlist/deletePlaylist");
const renamePlaylist = require("@/actions/playlist/renamePlaylist");
const togglePublicPlaylist = require("@/actions/playlist/togglePublicPlaylist");

describe("useMutatePlaylist", () => {
  let queryClient: QueryClient;

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };

  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    useNetworkStatus.mockReturnValue({ isOnline: true });
    deletePlaylist.mockResolvedValue(undefined);
    renamePlaylist.mockResolvedValue(undefined);
    togglePublicPlaylist.mockResolvedValue(undefined);
  });

  it("togglePublic success時にaction呼び出しとinvalidateを行う", async () => {
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMutatePlaylist("u1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.togglePublic.mutateAsync({
        playlistId: "p1",
        isPublic: true,
      });
    });

    expect(togglePublicPlaylist).toHaveBeenCalledWith("p1", "u1", true);
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [CACHED_QUERIES.playlists],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [CACHED_QUERIES.playlistById, "p1"],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [CACHED_QUERIES.getPublicPlaylists],
    });
  });

  it("rename success時にaction呼び出しとinvalidateを行う", async () => {
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMutatePlaylist("u1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.rename.mutateAsync({
        playlistId: "p1",
        title: "new title",
      });
    });

    expect(renamePlaylist).toHaveBeenCalledWith("p1", "new title", "u1");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [CACHED_QUERIES.playlists],
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [CACHED_QUERIES.playlistById, "p1"],
    });
  });

  it("remove success時にaction呼び出しとinvalidateを行う", async () => {
    const invalidateSpy = jest.spyOn(queryClient, "invalidateQueries");
    const { result } = renderHook(() => useMutatePlaylist("u1"), {
      wrapper: createWrapper(),
    });

    await act(async () => {
      await result.current.remove.mutateAsync({
        playlistId: "p1",
      });
    });

    expect(deletePlaylist).toHaveBeenCalledWith("p1", "u1");
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: [CACHED_QUERIES.playlistSongs, "p1"],
    });
  });

  it("userIdがない場合は認証エラー", async () => {
    const { result } = renderHook(() => useMutatePlaylist(undefined), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.rename.mutateAsync({ playlistId: "p1", title: "name" }),
    ).rejects.toThrow(AUTH_ERRORS.USER_ID_REQUIRED);
  });

  it("オフライン時は編集エラー", async () => {
    useNetworkStatus.mockReturnValue({ isOnline: false });
    const { result } = renderHook(() => useMutatePlaylist("u1"), {
      wrapper: createWrapper(),
    });

    await expect(
      result.current.togglePublic.mutateAsync({
        playlistId: "p1",
        isPublic: true,
      }),
    ).rejects.toThrow(PLAYLIST_ERRORS.EDIT_OFFLINE);
  });

  describe("楽観的更新", () => {
    describe("togglePublic", () => {
      it("mutate呼び出し時に即座にキャッシュが更新される（playlists）", async () => {
        // 初期状態: プレイリスト一覧にisPublic: falseのプレイリストがある
        queryClient.setQueryData([CACHED_QUERIES.playlists], [
          { id: "p1", title: "Playlist 1", isPublic: false, userId: "u1" },
        ]);
        queryClient.setQueryData([CACHED_QUERIES.playlistById, "p1"], {
          id: "p1",
          title: "Playlist 1",
          isPublic: false,
          userId: "u1",
        });

        // actionモック（遅延）
        togglePublicPlaylist.mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100)),
        );

        const { result } = renderHook(() => useMutatePlaylist("u1"), {
          wrapper: createWrapper(),
        });

        // mutate を呼び出し
        act(() => {
          result.current.togglePublic.mutate({
            playlistId: "p1",
            isPublic: false,
          });
        });

        // 楽観的更新: 即座にplaylistsキャッシュのisPublicが反転される
        await waitFor(() => {
          const playlists = queryClient.getQueryData<any[]>([
            CACHED_QUERIES.playlists,
          ]);
          expect(playlists?.[0].isPublic).toBe(true);
        });
      });

      it("エラー時にキャッシュがロールバックされる", async () => {
        queryClient.setQueryData([CACHED_QUERIES.playlists], [
          { id: "p1", title: "Playlist 1", isPublic: false, userId: "u1" },
        ]);

        togglePublicPlaylist.mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useMutatePlaylist("u1"), {
          wrapper: createWrapper(),
        });

        await act(async () => {
          result.current.togglePublic.mutate({
            playlistId: "p1",
            isPublic: false,
          });
        });

        // ロールバック: 元のisPublic: falseに戻る
        await waitFor(() => {
          const playlists = queryClient.getQueryData<any[]>([
            CACHED_QUERIES.playlists,
          ]);
          expect(playlists?.[0].isPublic).toBe(false);
        });
      });
    });

    describe("rename", () => {
      it("mutate呼び出し時に即座にキャッシュが更新される（playlists）", async () => {
        queryClient.setQueryData([CACHED_QUERIES.playlists], [
          { id: "p1", title: "Old Title", isPublic: false, userId: "u1" },
        ]);
        queryClient.setQueryData([CACHED_QUERIES.playlistById, "p1"], {
          id: "p1",
          title: "Old Title",
          isPublic: false,
          userId: "u1",
        });

        renamePlaylist.mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100)),
        );

        const { result } = renderHook(() => useMutatePlaylist("u1"), {
          wrapper: createWrapper(),
        });

        act(() => {
          result.current.rename.mutate({
            playlistId: "p1",
            title: "New Title",
          });
        });

        // 楽観的更新: 即座にplaylistsキャッシュのtitleが更新される
        await waitFor(() => {
          const playlists = queryClient.getQueryData<any[]>([
            CACHED_QUERIES.playlists,
          ]);
          expect(playlists?.[0].title).toBe("New Title");
        });
      });

      it("エラー時にキャッシュがロールバックされる", async () => {
        queryClient.setQueryData([CACHED_QUERIES.playlists], [
          { id: "p1", title: "Old Title", isPublic: false, userId: "u1" },
        ]);

        renamePlaylist.mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useMutatePlaylist("u1"), {
          wrapper: createWrapper(),
        });

        await act(async () => {
          result.current.rename.mutate({
            playlistId: "p1",
            title: "New Title",
          });
        });

        await waitFor(() => {
          const playlists = queryClient.getQueryData<any[]>([
            CACHED_QUERIES.playlists,
          ]);
          expect(playlists?.[0].title).toBe("Old Title");
        });
      });
    });

    describe("remove", () => {
      it("mutate呼び出し時に即座にキャッシュからプレイリストが削除される", async () => {
        queryClient.setQueryData([CACHED_QUERIES.playlists], [
          { id: "p1", title: "Playlist 1", isPublic: false, userId: "u1" },
          { id: "p2", title: "Playlist 2", isPublic: true, userId: "u1" },
        ]);

        deletePlaylist.mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100)),
        );

        const { result } = renderHook(() => useMutatePlaylist("u1"), {
          wrapper: createWrapper(),
        });

        act(() => {
          result.current.remove.mutate({ playlistId: "p1" });
        });

        // 楽観的更新: 即座にplaylistsキャッシュからp1が削除される
        await waitFor(() => {
          const playlists = queryClient.getQueryData<any[]>([
            CACHED_QUERIES.playlists,
          ]);
          expect(playlists?.length).toBe(1);
          expect(playlists?.[0].id).toBe("p2");
        });
      });

      it("エラー時にキャッシュがロールバックされる", async () => {
        const initialPlaylists = [
          { id: "p1", title: "Playlist 1", isPublic: false, userId: "u1" },
          { id: "p2", title: "Playlist 2", isPublic: true, userId: "u1" },
        ];
        queryClient.setQueryData([CACHED_QUERIES.playlists], initialPlaylists);

        deletePlaylist.mockRejectedValue(new Error("Network error"));

        const { result } = renderHook(() => useMutatePlaylist("u1"), {
          wrapper: createWrapper(),
        });

        await act(async () => {
          result.current.remove.mutate({ playlistId: "p1" });
        });

        await waitFor(() => {
          const playlists = queryClient.getQueryData<any[]>([
            CACHED_QUERIES.playlists,
          ]);
          expect(playlists?.length).toBe(2);
        });
      });
    });
  });
});
