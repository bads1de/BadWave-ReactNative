import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { sql } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { CACHED_QUERIES } from "@/constants";

/**
 * Supabase の楽曲データを SQLite に同期するフック
 * バックグラウンドで動作し、完了後にローカルクエリを更新
 */
export function useSyncSongs() {
  const queryClient = useQueryClient();

  const { data, isFetching, error, refetch } = useQuery({
    queryKey: [CACHED_QUERIES.songs, "sync"],
    queryFn: async () => {
      // Supabase から全楽曲を取得
      const { data: remoteSongs, error } = await supabase
        .from("songs")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      if (!remoteSongs || remoteSongs.length === 0) {
        return { synced: 0 };
      }

      // SQLite に Upsert (Batch)
      const valuesToInsert = remoteSongs.map((song) => ({
        id: song.id,
        userId: song.user_id,
        title: song.title,
        author: song.author,
        originalSongPath: song.song_path,
        originalImagePath: song.image_path,
        originalVideoPath: song.video_path ?? null,
        duration: typeof song.duration === "number" ? song.duration : null,
        genre: song.genre ?? null,
        lyrics: song.lyrics ?? null,
        createdAt: song.created_at,
        playCount: parseInt(String(song.count ?? 0), 10) || 0,
        likeCount: parseInt(String(song.like_count ?? 0), 10) || 0,
      }));

      if (valuesToInsert.length > 0) {
        await db
          .insert(songs)
          .values(valuesToInsert)
          .onConflictDoUpdate({
            target: songs.id,
            set: {
              title: sql`excluded.title`,
              author: sql`excluded.author`,
              originalSongPath: sql`excluded.original_song_path`,
              originalImagePath: sql`excluded.original_image_path`,
              originalVideoPath: sql`excluded.original_video_path`,
              duration: sql`excluded.duration`,
              genre: sql`excluded.genre`,
              lyrics: sql`excluded.lyrics`,
              playCount: sql`excluded.play_count`,
              likeCount: sql`excluded.like_count`,
            },
          });
      }

      return { synced: remoteSongs.length };
    },
    staleTime: 1000 * 60 * 5, // 5分
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  // 同期完了後、ローカルクエリを無効化
  useEffect(() => {
    if (data && data.synced > 0) {
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.songs, "local"],
      });
    }
  }, [data, queryClient]);

  return {
    syncedCount: data?.synced ?? 0,
    isSyncing: isFetching,
    syncError: error,
    triggerSync: refetch,
  };
}
