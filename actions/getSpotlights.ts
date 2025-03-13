import { Spotlight } from "@/types";
import { supabase } from "@/lib/supabase";

/**
 * スポットライトデータを取得する関数
 *
 * @description Supabaseデータベースの「spotlights」テーブルから全てのスポットライトデータを取得します。
 * 結果は作成日時の降順（最新のものが先頭）でソートされます。
 *
 * @returns {Promise<Spotlight[]>} スポットライトデータの配列を含むPromise
 * @throws {Error} データベースクエリでエラーが発生した場合
 */
const getSpotlights = async (): Promise<Spotlight[]> => {
  const { data, error } = await supabase
    .from("spotlights")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  return (data as Spotlight[]) || [];
};

export default getSpotlights;
