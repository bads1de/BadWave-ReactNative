import { eq, and, notInArray, sql } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { likedSongs } from "@/lib/db/schema";
import { CACHED_QUERIES, SUPABASE_TABLES } from "@/constants";
import { getErrorMessage } from "@/lib/utils/error";
import { useSyncBase } from "./useSyncBase";

/**
 * Supabase からいいねデータを取得し、ローカル SQLite に同期するフック
 *
 * @param userId ユーザーID
 */
export function useSyncLikedSongs(userId?: string) {
  return useSyncBase({
    queryKey: [CACHED_QUERIES.likedSongs, "sync", userId],
    queryFn: async () => {
      if (!userId) {
        return { synced: 0 };
      }

      const { data: remoteLikes, error } = await supabase
        .from(SUPABASE_TABLES.likedSongsRegular)
        .select("song_id, created_at")
        .eq("user_id", userId);

      if (error) {
        throw new Error(getErrorMessage(error));
      }

      if (!remoteLikes || remoteLikes.length === 0) {
        await db.transaction(async (tx) => {
          await tx.delete(likedSongs).where(eq(likedSongs.userId, userId));
        });
        return { synced: 0 };
      }

      await db.transaction(async (tx) => {
        const valuesToInsert = remoteLikes.map((like) => ({
          userId,
          songId: like.song_id,
          likedAt: like.created_at ?? new Date().toISOString(),
        }));

        if (valuesToInsert.length > 0) {
          await tx
            .insert(likedSongs)
            .values(valuesToInsert)
            .onConflictDoUpdate({
              target: [likedSongs.userId, likedSongs.songId],
              set: {
                likedAt: sql`excluded.liked_at`,
              },
            });
        }

        const remoteSongIds = remoteLikes.map((like) => like.song_id);
        await tx
          .delete(likedSongs)
          .where(
            and(
              eq(likedSongs.userId, userId),
              notInArray(likedSongs.songId, remoteSongIds),
            ),
          );
      });

      return { synced: remoteLikes.length };
    },
    invalidateQueryKey: [CACHED_QUERIES.likedSongs, userId],
  });
}

export default useSyncLikedSongs;
