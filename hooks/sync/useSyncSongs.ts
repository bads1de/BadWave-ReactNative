import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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

      // SQLite に Upsert
      for (const song of remoteSongs) {
        await db
          .insert(songs)
          .values({
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
          })
          .onConflictDoUpdate({
            target: songs.id,
            set: {
              title: song.title,
              author: song.author,
              originalSongPath: song.song_path,
              originalImagePath: song.image_path,
              originalVideoPath: song.video_path ?? null,
              duration:
                typeof song.duration === "number" ? song.duration : null,
              genre: song.genre ?? null,
              lyrics: song.lyrics ?? null,
              playCount: parseInt(String(song.count ?? 0), 10) || 0,
              likeCount: parseInt(String(song.like_count ?? 0), 10) || 0,
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
