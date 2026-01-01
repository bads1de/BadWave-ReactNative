import { useQuery } from "@tanstack/react-query";
import { desc } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { spotlights } from "@/lib/db/schema";
import { CACHE_CONFIG, CACHED_QUERIES } from "@/constants";
import { Spotlight } from "@/types";

/**
 * スポットライトをローカルSQLiteから取得するフック（Local-First）
 */
export function useGetLocalSpotlights() {
  return useQuery({
    queryKey: [CACHED_QUERIES.spotlights, "local"],
    queryFn: async (): Promise<Spotlight[]> => {
      const result = await db
        .select()
        .from(spotlights)
        .orderBy(desc(spotlights.createdAt));

      return result.map((row) => ({
        id: row.id,
        title: row.title,
        author: row.author,
        video_path: row.originalVideoPath ?? row.videoPath ?? "",
        genre: row.genre ?? undefined,
        description: row.description ?? undefined,
      }));
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    networkMode: "always",
  });
}

export default useGetLocalSpotlights;
