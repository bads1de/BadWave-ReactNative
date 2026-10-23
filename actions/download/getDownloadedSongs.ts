import { isNotNull } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { mapSongRowToSong } from "@/lib/utils/songMapper";
import Song from "@/types";

/**
 * ダウンロード済みの曲を SQLite から取得する
 * @returns songPath が設定されている曲一覧
 */
const getDownloadedSongs = async (): Promise<Song[]> => {
  const rows = await db
    .select()
    .from(songs)
    .where(isNotNull(songs.songPath));

  return rows
    .filter((row) => row.songPath)
    .map((row) => mapSongRowToSong(row));
};

export default getDownloadedSongs;
