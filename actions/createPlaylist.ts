import { supabase } from "@/lib/supabase";

/**
 * @fileoverview プレイリスト作成モジュール
 * このモジュールは、新しいプレイリストを作成する機能を提供します。
 */

/**
 * 新しいプレイリストを作成する
 *
 * @param {string} userId ユーザーID
 * @param {string} title プレイリストタイトル
 * @param {boolean} isPublic 公開設定
 * @returns {Promise<Playlist>} 作成されたプレイリスト
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * const playlist = await createPlaylist('user-id-123', 'My Playlist');
 * console.log(playlist);
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
