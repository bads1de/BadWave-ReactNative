import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { spotlights } from "@/lib/db/schema";
import { CACHED_QUERIES } from "@/constants";

/**
 * スポットライトをSupabaseから取得し、SQLiteに同期するフック
 */
export function useSyncSpotlights() {
  const queryClient = useQueryClient();

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: [CACHED_QUERIES.spotlights, "sync"],
    queryFn: async () => {
      const { data: remoteSpotlights, error } = await supabase
        .from("spotlights")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        throw new Error(error.message);
      }

      if (!remoteSpotlights || remoteSpotlights.length === 0) {
        return { synced: 0 };
      }

      // SQLite に Upsert
      for (const spot of remoteSpotlights) {
        await db
          .insert(spotlights)
          .values({
            id: spot.id,
            title: spot.title,
            author: spot.author,
            description: spot.description,
            genre: spot.genre,
            originalVideoPath: spot.video_path,
            originalThumbnailPath: spot.thumbnail_path,
            createdAt: spot.created_at,
          })
          .onConflictDoUpdate({
            target: spotlights.id,
            set: {
              title: spot.title,
              author: spot.author,
              description: spot.description,
              genre: spot.genre,
              originalVideoPath: spot.video_path,
              originalThumbnailPath: spot.thumbnail_path,
            },
          });
      }

      return { synced: remoteSpotlights.length };
    },
    staleTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    if (data && data.synced > 0) {
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.spotlights, "local"],
      });
    }
  }, [data, queryClient]);

  return {
    syncedCount: data?.synced ?? 0,
    isSyncing: isLoading,
    syncError: error,
    triggerSync: refetch,
  };
}

export default useSyncSpotlights;
