import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";

export interface LocalPaths {
  songPath: string | null;
  imagePath: string | null;
}

/**
 * 曲のローカル保存パスを取得する
 * @param songId 曲のID
 * @returns ローカルパス（未ダウンロードの場合は null）
 */
const getLocalPaths = async (songId: string): Promise<LocalPaths> => {
  const rows = await db
    .select({
      songPath: songs.songPath,
      imagePath: songs.imagePath,
    })
    .from(songs)
    .where(eq(songs.id, songId))
    .limit(1);

  return rows[0] ?? { songPath: null, imagePath: null };
};

export default getLocalPaths;
