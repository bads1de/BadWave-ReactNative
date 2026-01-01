import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { desc } from "drizzle-orm";
import { CACHED_QUERIES } from "@/constants";

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

      // スキーマの形式を既存の Song 型に変換
      return result.map((row) => ({
        id: row.id,
        user_id: row.userId,
        title: row.title,
        author: row.author,
        song_path: row.originalSongPath ?? row.songPath ?? "",
        image_path: row.originalImagePath ?? row.imagePath ?? "",
        duration: row.duration ?? undefined,
        genre: row.genre ?? undefined,
        count: row.playCount ?? 0,
        like_count: row.likeCount ?? 0,
        created_at: row.createdAt ?? "",
        // ローカルパス情報（オフライン再生用）
        local_song_path: row.songPath ?? undefined,
        local_image_path: row.imagePath ?? undefined,
      }));
    },
    staleTime: Infinity, // ローカルDBなので常に新鮮とみなす
  });
}
