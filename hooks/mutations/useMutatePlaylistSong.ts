import { useMutation, useQueryClient } from "@tanstack/react-query";
import addPlaylistSong from "@/actions/playlist/addPlaylistSong";
import deletePlaylistSong from "@/actions/playlist/deletePlaylistSong";
import { CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { AUTH_ERRORS, PLAYLIST_ERRORS } from "@/constants/errorMessages";
import Song from "@/types";

/**
 * プレイリスト曲の操作（追加・削除）を行うカスタムフック
 * オンライン時のみ操作可能。Supabase と SQLite の両方に書き込む。
 *
 * @param userId ユーザーID
 */
export function useMutatePlaylistSong(userId?: string) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  /**
   * プレイリストに曲を追加
   */
  const addSong = useMutation({
    mutationFn: async ({
      songId,
      playlistId,
    }: {
      songId: string;
      playlistId: string;
    }) => {
      if (!userId) {
        throw new Error(AUTH_ERRORS.USER_ID_REQUIRED);
      }

      if (!isOnline) {
        throw new Error(PLAYLIST_ERRORS.EDIT_OFFLINE);
      }

      // 追加処理は action に一本化し、Supabase / SQLite / 画像更新を揃える
      await addPlaylistSong({ playlistId, userId, songId });

      return { songId, playlistId };
    },
    // 楽観的更新
    onMutate: async ({ songId, playlistId }) => {
      // 1. 既存のクエリをキャンセル
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.playlistSongs, playlistId],
      });

      // 2. 現在のキャッシュをスナップショット
      const previousSongs = queryClient.getQueryData<Song[]>([
        CACHED_QUERIES.playlistSongs,
        playlistId,
      ]);

      // 3. 楽観的にキャッシュを更新（曲を追加）
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistSongs, playlistId],
        (old: Song[] | undefined) => [
          ...(old || []),
          {
            id: `temp_${Date.now()}`,
            songId,
            playlistId,
            addedAt: new Date().toISOString(),
          },
        ]
      );

      return { previousSongs };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistSongs, variables.playlistId],
      });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlists],
      });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistStatus, variables.songId],
      });
    },
    onError: (error, variables, context) => {
      // ロールバック
      if (context?.previousSongs) {
        queryClient.setQueryData(
          [CACHED_QUERIES.playlistSongs, variables.playlistId],
          context.previousSongs
        );
      }
      console.error("Error adding song to playlist:", error);
    },
  });

  /**
   * プレイリストから曲を削除
   */
  const removeSong = useMutation({
    mutationFn: async ({
      songId,
      playlistId,
    }: {
      songId: string;
      playlistId: string;
    }) => {
      if (!userId) {
        throw new Error(AUTH_ERRORS.USER_ID_REQUIRED);
      }

      if (!isOnline) {
        throw new Error(PLAYLIST_ERRORS.EDIT_OFFLINE);
      }

      // 削除処理は action に一本化し、Supabase / SQLite を揃える
      await deletePlaylistSong(playlistId, songId, userId);

      return { songId, playlistId };
    },
    // 楽観的更新
    onMutate: async ({ songId, playlistId }) => {
      // 1. 既存のクエリをキャンセル
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.playlistSongs, playlistId],
      });

      // 2. 現在のキャッシュをスナップショット
      const previousSongs = queryClient.getQueryData<Song[]>([
        CACHED_QUERIES.playlistSongs,
        playlistId,
      ]);

      // 3. 楽観的にキャッシュを更新（曲を削除）
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistSongs, playlistId],
        (old: Song[] | undefined) =>
          (old || []).filter(
            (song) => ((song as any).songId ?? song.id) !== songId
          )
      );

      return { previousSongs };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistSongs, variables.playlistId],
      });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlists],
      });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistStatus, variables.songId],
      });
    },
    onError: (error, variables, context) => {
      // ロールバック
      if (context?.previousSongs) {
        queryClient.setQueryData(
          [CACHED_QUERIES.playlistSongs, variables.playlistId],
          context.previousSongs
        );
      }
      console.error("Error removing song from playlist:", error);
    },
  });

  return {
    addSong,
    removeSong,
  };
}

export default useMutatePlaylistSong;

