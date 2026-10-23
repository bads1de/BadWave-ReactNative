import { isNotNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";

export interface DownloadedFile {
  id: string;
  songPath: string | null;
  imagePath: string | null;
}

/**
 * ダウンロード済み曲のファイルパス一覧を取得する
 * 曲本体とアートワークの一括削除・サイズ集計に使用する。
 */
const getDownloadedFiles = async (): Promise<DownloadedFile[]> => {
  const rows = await db
    .select({
      id: songs.id,
      songPath: songs.songPath,
      imagePath: songs.imagePath,
    })
    .from(songs)
    .where(isNotNull(songs.songPath));

  return rows.filter((row) => row.songPath);
};

export default getDownloadedFiles;
