import { supabase } from "@/lib/supabase";

/**
 * @fileoverview プレイリスト作成モジュール
 * このモジュールは、新しいプレイリストを作成する機能を提供します。
 */

/**
 * 新しいプレイリストを作成する
 * @description
 * 認証済みユーザーのために新しいプレイリストを作成します。
 * プレイリスト名は必須で、空文字列は許可されません。
 *
 * @param {string} name - 作成するプレイリストの名前
 * @returns {Promise<void>} プレイリスト作成の成功時は何も返さない
 * @throws {Error} 以下の場合にエラーをスロー:
 *   - ユーザーが認証されていない場合
 *   - データベース操作に失敗した場合
 *
 * @example
 * ```typescript
 * // 新しいプレイリストを作成
 * await createPlaylist("My Favorite Songs");
 * ```
 */
const createPlaylist = async (name: string): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase.from("playlists").insert({
    user_id: session?.user.id,
    title: name,
  });

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }
};

export default createPlaylist;
