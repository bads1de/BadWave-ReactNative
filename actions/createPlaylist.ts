import { supabase } from "../lib/supabase";
import Playlist from "../types";

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
 * const playlist = await createPlaylist('user-id-123', 'My Playlist', true);
 * console.log(playlist);
 * ```
 */
const createPlaylist = async (
  userId: string,
  title: string,
  isPublic: boolean
): Promise<Playlist> => {
  const { data, error } = await supabase
    .from("playlists")
    .insert({ user_id: userId, title, is_public: isPublic })
    .select()
    .single();

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  return data as Playlist;
};

export default createPlaylist;
