import { supabase } from "@/lib/supabase";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { playlists } from "@/lib/db/schema";

/**
 * プレイリストの名前を変更する
 *
 * @param {string} playlistId プレイリストID
 * @param {string} newTitle 新しいプレイリスト名
 * @param {string} userId ユーザーID
 * @returns {Promise<void>} 処理が成功した場合は何も返さない
 * @throws {Error} プレイリスト名が空の場合、または更新時にエラーが発生した場合
 *
 * @example
 * ```typescript
 * await renamePlaylist('playlist-id-123', '新しいタイトル', 'user-id-456');
 * ```
 */
const renamePlaylist = async (
  playlistId: string,
  newTitle: string,
  userId: string
): Promise<void> => {
  if (!newTitle.trim()) {
    throw new Error("プレイリスト名を入力してください");
  }

  const { error } = await supabase
    .from("playlists")
    .update({ title: newTitle.trim() })
    .match({ id: playlistId, user_id: userId });

  if (error) {
    console.error("プレイリストの更新中にエラーが発生しました:", error);
    throw new Error(error.message);
  }

  await db
    .update(playlists)
    .set({ title: newTitle.trim() })
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));
};

export default renamePlaylist;
