import { and, notInArray, inArray, sql } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { playlists, playlistSongs } from "@/lib/db/schema";
import { CACHED_QUERIES, SUPABASE_TABLES } from "@/constants";
import { useSyncBase } from "./useSyncBase";

/**
 * Supabase からプレイリストデータを取得し、ローカル SQLite に同期するフック
 *
 * @param userId ユーザーID
 */
export function useSyncPlaylists(userId?: string) {
  return useSyncBase({
    queryKey: [CACHED_QUERIES.playlists, "sync", userId],
    queryFn: async () => {
      if (!userId) {
        return { synced: 0 };
      }

      const { data: remotePlaylists, error: playlistError } = await supabase
        .from(SUPABASE_TABLES.playlists)
        .select("*, playlist_songs(*)")
        .eq("user_id", userId);

      if (playlistError) {
        throw new Error(playlistError.message);
      }

      if (!remotePlaylists || remotePlaylists.length === 0) {
        return { synced: 0 };
      }

      await db.transaction(async (tx) => {
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

        const allSongsToInsert: { id: string; playlistId: string; songId: string; addedAt: string }[] = [];
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
            await tx
              .delete(playlistSongs)
              .where(inArray(playlistSongs.playlistId, remotePlaylistIds));
          }
        }
      });

      return { synced: remotePlaylists.length };
    },
    invalidateQueryKey: [CACHED_QUERIES.playlists, "user", userId],
  });
}

export default useSyncPlaylists;
