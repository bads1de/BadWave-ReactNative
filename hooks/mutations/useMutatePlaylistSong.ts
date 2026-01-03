import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eq, and } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { playlistSongs } from "@/lib/db/schema";
import { CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { withSupabaseRetry } from "@/lib/utils/retry";
import { AUTH_ERRORS, PLAYLIST_ERRORS } from "@/constants/errorMessages";

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

      // 1. Supabase に追加（先に実行、リトライ付き）
      const result = await withSupabaseRetry(async () => {
        return await supabase.from("playlist_songs").insert({
          playlist_id: playlistId,
          user_id: userId,
          song_id: songId,
          song_type: "regular",
        });
      });

      if (result.error) {
        throw new Error(
          `${PLAYLIST_ERRORS.SUPABASE_INSERT_FAILED}: ${result.error.message}`
        );
      }

      // 2. ローカルDBに追加（Supabase成功後）
      const newId = `${playlistId}_${songId}_${Date.now()}`;
      await db.insert(playlistSongs).values({
        id: newId,
        playlistId,
        songId,
        addedAt: new Date().toISOString(),
      });

      return { songId, playlistId };
    },
    // 楽観的更新
    onMutate: async ({ songId, playlistId }) => {
      // 1. 既存のクエリをキャンセル
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.playlistSongs, playlistId],
      });

      // 2. 現在のキャッシュをスナップショット
      const previousSongs = queryClient.getQueryData<any[]>([
        CACHED_QUERIES.playlistSongs,
        playlistId,
      ]);

      // 3. 楽観的にキャッシュを更新（曲を追加）
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistSongs, playlistId],
        (old: any[] | undefined) => [
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

      // 1. Supabase から削除（先に実行、リトライ付き）
      const result = await withSupabaseRetry(async () => {
        return await supabase
          .from("playlist_songs")
          .delete()
          .eq("playlist_id", playlistId)
          .eq("user_id", userId)
          .eq("song_id", songId);
      });

      if (result.error) {
        throw new Error(
          `${PLAYLIST_ERRORS.SUPABASE_DELETE_FAILED}: ${result.error.message}`
        );
      }

      // 2. ローカルDBから削除（Supabase成功後）
      await db
        .delete(playlistSongs)
        .where(
          and(
            eq(playlistSongs.playlistId, playlistId),
            eq(playlistSongs.songId, songId)
          )
        );

      return { songId, playlistId };
    },
    // 楽観的更新
    onMutate: async ({ songId, playlistId }) => {
      // 1. 既存のクエリをキャンセル
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.playlistSongs, playlistId],
      });

      // 2. 現在のキャッシュをスナップショット
      const previousSongs = queryClient.getQueryData<any[]>([
        CACHED_QUERIES.playlistSongs,
        playlistId,
      ]);

      // 3. 楽観的にキャッシュを更新（曲を削除）
      queryClient.setQueryData(
        [CACHED_QUERIES.playlistSongs, playlistId],
        (old: any[] | undefined) =>
          (old || []).filter((song: any) => song.songId !== songId)
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
