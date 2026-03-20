import { renderHook, act } from "@testing-library/react-native";
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
});
