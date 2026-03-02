import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { eq, and, notInArray, inArray, sql } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { playlists, playlistSongs } from "@/lib/db/schema";
import { CACHED_QUERIES } from "@/constants";

/**
 * Supabase からプレイリストデータを取得し、ローカル SQLite に同期するフック
 *
 * 安全な同期ロジック:
 * 1. プレイリストはUpsert（挿入または更新）
 * 2. プレイリスト曲はトランザクション内でUpsert + 差分削除
 * 3. 失敗時は自動ロールバック
 *
 * @param userId ユーザーID
 */
export function useSyncPlaylists(userId?: string) {
  const queryClient = useQueryClient();

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [CACHED_QUERIES.playlists, "sync", userId],
    queryFn: async () => {
      if (!userId) {
        return { synced: 0 };
      }

      // 1. プレイリスト一覧とその中の曲データを一括で取得 (N+1の解消)
      const { data: remotePlaylists, error: playlistError } = await supabase
        .from("playlists")
        .select("*, playlist_songs(*)")
        .eq("user_id", userId);

      if (playlistError) {
        throw new Error(playlistError.message);
      }

      if (!remotePlaylists || remotePlaylists.length === 0) {
        return { synced: 0 };
      }

      // 2. プレイリストと曲を SQLite に同期 (トランザクション内でバッチ処理)
      await db.transaction(async (tx) => {
        // --- プレイリスト本体のバッチUpsert ---
        const playlistsToInsert = remotePlaylists.map((playlist) => ({
          id: playlist.id,
          userId: playlist.user_id,
          title: playlist.title,
          imagePath: playlist.image_path,
          isPublic: playlist.is_public,
          createdAt: playlist.created_at,
        }));

        if (playlistsToInsert.length > 0) {
          await tx
            .insert(playlists)
            .values(playlistsToInsert)
            .onConflictDoUpdate({
              target: playlists.id,
              set: {
                title: sql`excluded.title`,
                imagePath: sql`excluded.image_path`,
                isPublic: sql`excluded.is_public`,
              },
            });
        }

        // --- プレイリスト内の曲の同期 (N+1問題の解消) ---
        const allSongsToInsert: any[] = [];
        const validPlaylistSongIds: string[] = [];
        const remotePlaylistIds = remotePlaylists.map((p) => p.id);

        for (const playlist of remotePlaylists) {
          const remoteSongs = playlist.playlist_songs || [];
          for (const song of remoteSongs) {
            allSongsToInsert.push({
              id: song.id,
              playlistId: song.playlist_id,
              songId: song.song_id,
              addedAt: song.created_at,
            });
            validPlaylistSongIds.push(song.id);
          }
        }

        if (allSongsToInsert.length > 0) {
          await tx
            .insert(playlistSongs)
            .values(allSongsToInsert)
            .onConflictDoUpdate({
              target: playlistSongs.id,
              set: {
                songId: sql`excluded.song_id`,
                addedAt: sql`excluded.added_at`,
              },
            });
        }

        // リモートに存在しないプレイリスト曲を一括削除
        if (remotePlaylistIds.length > 0) {
          if (validPlaylistSongIds.length > 0) {
            await tx
              .delete(playlistSongs)
              .where(
                and(
                  inArray(playlistSongs.playlistId, remotePlaylistIds),
                  notInArray(playlistSongs.id, validPlaylistSongIds),
                ),
              );
          } else {
            // すべてのプレイリストが空の場合
            await tx
              .delete(playlistSongs)
              .where(inArray(playlistSongs.playlistId, remotePlaylistIds));
          }
        }
      });

      return { synced: remotePlaylists.length };
    },
    staleTime: 1000 * 60 * 5, // 5分
    refetchOnWindowFocus: false,
    enabled: false,
  });

  // 同期完了後、ローカルクエリを無効化
  useEffect(() => {
    if (data && data.synced > 0) {
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlists, "user", userId],
      });
    }
  }, [data, queryClient, userId]);

  return {
    syncedCount: data?.synced ?? 0,
    isSyncing: isFetching,
    syncError: error,
    triggerSync: refetch,
  };
}

export default useSyncPlaylists;
