import { inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";

export interface SongPathInfo {
  localPath: string | null;
  originalPath: string | null;
}

/** SQLite のバインド変数上限を避けるための1回あたりの取得件数 */
const QUERY_BATCH_SIZE = 500;

/**
 * 複数曲のパス情報を一括取得する（N+1クエリの回避）
 *
 * 再生キュー構築時に曲ごとの個別クエリを呼ぶと曲数分のクエリが発生するため、
 * IN句を用いてまとめて取得する。大量のIDでもSQLiteのバインド上限に
 * かからないよう、一定件数ずつに分割する。
 *
 * @param songIds 取得対象の曲ID配列
 * @returns songId をキーに { localPath, originalPath } を持つMap
 *          （DBに存在する曲のみ格納。localPath は未ダウンロード時 null）
 */
const getSongPathsBatch = async (
  songIds: string[],
): Promise<Map<string, SongPathInfo>> => {
  const result = new Map<string, SongPathInfo>();

  const validIds = songIds.filter((id): id is string => Boolean(id));

  for (let i = 0; i < validIds.length; i += QUERY_BATCH_SIZE) {
    const batch = validIds.slice(i, i + QUERY_BATCH_SIZE);

    const rows = await db
      .select({
        id: songs.id,
        songPath: songs.songPath,
        originalSongPath: songs.originalSongPath,
      })
      .from(songs)
      .where(inArray(songs.id, batch));

    for (const row of rows) {
      result.set(row.id, {
        localPath: row.songPath ?? null,
        originalPath: row.originalSongPath ?? null,
      });
    }
  }

  return result;
};

export default getSongPathsBatch;
