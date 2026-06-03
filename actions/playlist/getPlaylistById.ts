import { supabase } from "@/lib/supabase";
import { Playlist } from "@/types";
import { getErrorMessage } from "@/lib/utils/error";

/**
 * @fileoverview プレイリスト詳細取得モジュール
 * このモジュールは、指定されたIDのプレイリスト詳細情報を取得する機能を提供します。
 */

/**
 * 指定IDのプレイリストを取得する
 *
 * @param {string} playlistId プレイリストID
 * @returns {Promise<Playlist | null>} プレイリスト。存在しない場合はnull
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * const playlist = await getPlaylistById('playlist-id-123');
 * console.log(playlist);
 * ```
 */
const getPlaylistById = async (playlistId: string): Promise<Playlist | null> => {
  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", playlistId)
    .single();

  if (error) {
    console.error(getErrorMessage(error));
    throw new Error(getErrorMessage(error));
  }

  return (data as Playlist) || null;
};

export default getPlaylistById;
