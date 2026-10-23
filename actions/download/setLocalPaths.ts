import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";

interface SetLocalPathsInput {
  songId: string;
  songPath: string | null;
  imagePath: string | null;
}

/**
 * 曲のローカル保存パスを SQLite に保存する
 *
 * imagePath が null の場合は既存の画像パスを保持する
 * （画像ダウンロード失敗時に既存アートワークを消さないため）。
 */
const setLocalPaths = async ({
  songId,
  songPath,
  imagePath,
}: SetLocalPathsInput): Promise<void> => {
  const updateData: {
    songPath: string | null;
    downloadedAt: Date | null;
    imagePath?: string | null;
  } = {
    songPath,
    downloadedAt: songPath ? new Date() : null,
  };

  if (imagePath) {
    updateData.imagePath = imagePath;
  }

  await db.update(songs).set(updateData).where(eq(songs.id, songId));
};

export default setLocalPaths;
