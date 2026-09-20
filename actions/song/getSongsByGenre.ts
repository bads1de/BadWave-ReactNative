/**
 * @fileoverview ジャンルベースの曲検索モジュール
 * このモジュールは、指定されたジャンルに基づいて曲を検索する機能を提供します。
 */

import Song from "@/types";
import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES } from "@/constants";
import { runQuery } from "@/lib/utils/supabaseQuery";

/**
 * ジャンルに基づいて曲を検索する
 * @description
 * 指定されたジャンルに一致する曲をデータベースから検索します。
 * 複数のジャンルを指定することも可能です。
 *
 * @param {string | string[]} genre - 検索対象のジャンル（単一または複数）
 * @returns {Promise<Song[]>} 検索結果の曲一覧
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * // 単一ジャンルで検索
 * const popSongs = await getSongsByGenre("Pop");
 *
 * // 複数ジャンルで検索
 * const songs = await getSongsByGenre(["Rock", "Jazz"]);
 *
 * // カンマ区切りの文字列で検索
 * const mixedSongs = await getSongsByGenre("Hip Hop, R&B");
 * ```
 */
const getSongsByGenre = async (genre: string | string[]): Promise<Song[]> => {
  // 空要素を除去する（"Pop," のような入力で `genre.ilike.%%`（全件一致）になるのを防ぐ）
  const genreArray = (
    typeof genre === "string" ? genre.split(",") : (genre ?? [])
  )
    .map((g) => g.trim())
    .filter(Boolean);

  // ジャンルが未指定の場合は空で返す（`.or("")` は不正なフィルタになるため）
  if (genreArray.length === 0) return [];

  // データベースから曲を検索
  const data = await runQuery(async () =>
    supabase
      .from(SUPABASE_TABLES.songs)
      .select("*")
      .or(genreArray.map((genre) => `genre.ilike.%${genre}%`).join(","))
      .order("created_at", { ascending: false }),
  );

  return (data as Song[]) || [];
};

export default getSongsByGenre;
