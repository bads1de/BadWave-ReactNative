import { inArray } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";

/** SQLite のバインド変数上限を避けるための1回あたりの更新件数 */
const CLEAR_BATCH_SIZE = 500;

/**
 * 複数曲のローカル保存パスを一括でクリアする
 * 削除時の N+1 アップデートを避けるため、1回の UPDATE で処理する。
 */
const clearLocalPaths = async (songIds: string[]): Promise<void> => {
  for (let i = 0; i < songIds.length; i += CLEAR_BATCH_SIZE) {
    const batch = songIds.slice(i, i + CLEAR_BATCH_SIZE);

    await db
      .update(songs)
      .set({
        songPath: null,
        imagePath: null,
        downloadedAt: null,
      })
      .where(inArray(songs.id, batch));
  }
};

export default clearLocalPaths;
