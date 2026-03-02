import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { eq, and, notInArray } from "drizzle-orm";
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

      // 1. プレイリスト一覧を取得
      const { data: remotePlaylists, error: playlistError } = await supabase
        .from("playlists")
        .select("*")
        .eq("user_id", userId);

      if (playlistError) {
        throw new Error(playlistError.message);
      }

      if (!remotePlaylists || remotePlaylists.length === 0) {
        return { synced: 0 };
      }

      // 2. プレイリストを SQLite に同期
      for (const playlist of remotePlaylists) {
        await db
          .insert(playlists)
          .values({
            id: playlist.id,
            userId: playlist.user_id,
            title: playlist.title,
            imagePath: playlist.image_path,
            isPublic: playlist.is_public,
            createdAt: playlist.created_at,
          })
          .onConflictDoUpdate({
            target: playlists.id,
            set: {
              title: playlist.title,
              imagePath: playlist.image_path,
              isPublic: playlist.is_public,
            },
          });

        // 3. プレイリスト内の曲を同期
        const { data: remoteSongs, error: songsError } = await supabase
          .from("playlist_songs")
          .select("*")
          .eq("playlist_id", playlist.id);

        if (songsError) {
          console.warn(
            "[SyncPlaylists] Error fetching playlist songs:",
            songsError,
          );
          continue;
        }

        // トランザクション内で安全に同期
        await db.transaction(async (tx) => {
          if (remoteSongs && remoteSongs.length > 0) {
            // 1. リモートデータをUpsert
            for (const song of remoteSongs) {
              await tx
                .insert(playlistSongs)
                .values({
                  id: song.id,
                  playlistId: song.playlist_id,
                  songId: song.song_id,
                  addedAt: song.created_at,
                })
                .onConflictDoUpdate({
                  target: playlistSongs.id,
                  set: {
                    songId: song.song_id,
                    addedAt: song.created_at,
                  },
                });
            }

            // 2. リモートにないデータを削除（Upsert完了後）
            const remoteSongIds = remoteSongs.map((s) => s.id);
            await tx
              .delete(playlistSongs)
              .where(
                and(
                  eq(playlistSongs.playlistId, playlist.id),
                  notInArray(playlistSongs.id, remoteSongIds),
                ),
              );
          } else {
            // リモートが空の場合、ローカルも空にする
            await tx
              .delete(playlistSongs)
              .where(eq(playlistSongs.playlistId, playlist.id));
          }
        });
      }

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
