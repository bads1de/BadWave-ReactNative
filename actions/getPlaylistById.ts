import { supabase } from "@/lib/supabase";
import { Playlist } from "@/types";

/**
 * @fileoverview プレイリスト詳細取得モジュール
 * このモジュールは、指定されたIDのプレイリスト詳細情報を取得する機能を提供します。
 */

/**
 * IDを指定してプレイリスト情報を取得する
 * @description
 * 指定されたプレイリストIDに一致するプレイリストの詳細情報を取得します。
 * プレイリストが存在しない場合はnullを返します。
 *
 * @param {string} playlistId 取得するプレイリストのID
 * @returns {Promise<Playlist | null>} プレイリスト情報またはnull
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * // プレイリストを取得
 * const playlist = await getPlaylistById("123");
 * if (playlist) {
 *   console.log(playlist.title); // プレイリスト名
 * }
 * ```
 */
const getPlaylistById = async (
  playlistId: string
): Promise<Playlist | null> => {
  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", playlistId)
    .single();

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  return (data as Playlist) || null;
};

export default getPlaylistById;
