import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { CACHED_QUERIES } from "@/constants";
import { mapSongRowToSong } from "@/lib/utils/songMapper";

/**
 * ローカル SQLite から楽曲一覧を取得するフック
 * UI はこのフックを通じてローカルDBからのみデータを読み込みます（Local-First）
 */
export function useGetLocalSongs() {
  return useQuery({
    queryKey: [CACHED_QUERIES.songs, "local"],
    queryFn: async () => {
      const result = await db
        .select()
        .from(songs)
        .orderBy(desc(songs.createdAt));

      return result.map((row) => mapSongRowToSong(row));
    },
    staleTime: Infinity, // ローカルDBなので常に新鮮とみなす
  });
}
