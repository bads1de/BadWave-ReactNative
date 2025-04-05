import { supabase } from "../lib/supabase";
import Song from "../types";

/**
 * @fileoverview 曲一覧取得モジュール
 * このモジュールは、データベースから曲の一覧を取得する機能を提供します。
 */

/**
 * 曲の一覧を取得する
 * @description
 * データベースから最新の曲を最大20件取得します。
 * デフォルトでは作成日時の降順でソートされます。
 *
 * @returns {Promise<Song[]>} 曲の配列
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * // 曲一覧を取得
 * const songs = await getSongs();
 * console.log(songs); // [{id: "1", title: "Song 1", ...}, ...]
 * ```
 */
const getSongs = async (): Promise<Song[]> => {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  return (data as Song[]) || [];
};

export default getSongs;
