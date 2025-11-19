import { supabase } from "@/lib/supabase";

/**
 * @fileoverview プレイリスト作成モジュール
 * このモジュールは、新しいプレイリストを作成する機能を提供します。
 */

/**
 * 新しいプレイリストを作成する
 *
 * @param {string} title プレイリストタイトル
 * @returns {Promise<void>}
 * @throws {Error} ユーザーが認証されていない場合、またはデータベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * await createPlaylist('My New Playlist');
 * ```
 */
const createPlaylist = async (title: string): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase.from("playlists").insert({
    user_id: session?.user.id,
    title: title.trim(),
  });

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }
};

export default createPlaylist;
