import { useMutation, useQueryClient } from "@tanstack/react-query";
import { eq, and } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { playlistSongs } from "@/lib/db/schema";
import { CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

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
        throw new Error("ユーザーIDが必要です");
      }

      if (!isOnline) {
        throw new Error("オフライン時はプレイリストの編集ができません");
      }

      // 1. SQLite に追加
      const newId = `${playlistId}_${songId}_${Date.now()}`;
      await db.insert(playlistSongs).values({
        id: newId,
        playlistId,
        songId,
        addedAt: new Date().toISOString(),
      });

      // 2. Supabase に追加
      const { error } = await supabase.from("playlist_songs").insert({
        playlist_id: playlistId,
        user_id: userId,
        song_id: songId,
        song_type: "regular",
      });

      if (error) {
        console.warn("[Playlist] Supabase insert failed:", error);
      }

      return { songId, playlistId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistSongs, variables.playlistId],
      });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlists],
      });
    },
    onError: (error) => {
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
        throw new Error("ユーザーIDが必要です");
      }

      if (!isOnline) {
        throw new Error("オフライン時はプレイリストの編集ができません");
      }

      // 1. SQLite から削除
      await db
        .delete(playlistSongs)
        .where(
          and(
            eq(playlistSongs.playlistId, playlistId),
            eq(playlistSongs.songId, songId)
          )
        );

      // 2. Supabase から削除
      const { error } = await supabase
        .from("playlist_songs")
        .delete()
        .eq("playlist_id", playlistId)
        .eq("user_id", userId)
        .eq("song_id", songId);

      if (error) {
        console.warn("[Playlist] Supabase delete failed:", error);
      }

      return { songId, playlistId };
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlistSongs, variables.playlistId],
      });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlists],
      });
    },
    onError: (error) => {
      console.error("Error removing song from playlist:", error);
    },
  });

  return {
    addSong,
    removeSong,
  };
}

export default useMutatePlaylistSong;
