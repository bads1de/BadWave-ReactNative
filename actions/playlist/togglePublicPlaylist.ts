import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES } from "@/constants";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { playlists } from "@/lib/db/schema";
import { runQuery } from "@/lib/utils/supabaseQuery";

/**
 * プレイリストの公開設定を切り替える
 *
 * @param {string} playlistId - プレイリストID
 * @param {string} userId - ユーザーID
 * @param {boolean} isPublic - 公開設定 (true: 公開, false: 非公開)
 * @returns {Promise<void>} 処理が成功した場合は何も返さない
 * @throws {Error} データベース更新時にエラーが発生した場合
 *
 * @example
 * ```typescript
 * await togglePublicPlaylist('playlist-id-123', 'user-id-456', true);
 * ```
 */
const togglePublicPlaylist = async (
  playlistId: string,
  userId: string,
  isPublic: boolean
): Promise<void> => {
  await runQuery(async () =>
    supabase
      .from(SUPABASE_TABLES.playlists)
      .update({ is_public: isPublic })
      .eq("id", playlistId)
      .eq("user_id", userId),
  );

  // ローカルファースト表示の整合を保つため SQLite も即時更新する
  await db
    .update(playlists)
    .set({ isPublic })
    .where(and(eq(playlists.id, playlistId), eq(playlists.userId, userId)));
};

export default togglePublicPlaylist;
