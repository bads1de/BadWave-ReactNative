import Song from "@/types";
import dayjs from "dayjs";
import { supabase } from "@/lib/supabase";

export type TrendPeriod = "all" | "month" | "week" | "day";

/**
 * 指定期間のトレンド曲を取得する
 *
 * @param {TrendPeriod} period - 取得する期間 ('all'|'month'|'week'|'day')
 * @returns {Promise<Song[]>} トレンド曲の配列
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * const songs = await getTrendSongs('week');
 * console.log(songs);
 * ```
 */
const getTrendSongs = async (period: TrendPeriod = "all"): Promise<Song[]> => {
  let query = supabase.from("songs").select("*");

  // 指定された期間に基づいてデータをフィルタリング
  switch (period) {
    case "month":
      query = query.filter(
        "created_at",
        "gte",
        dayjs().subtract(1, "month").toISOString()
      );
      break;
    case "week":
      query = query.filter(
        "created_at",
        "gte",
        dayjs().subtract(1, "week").toISOString()
      );
      break;
    case "day":
      query = query.filter(
        "created_at",
        "gte",
        dayjs().subtract(1, "day").toISOString()
      );
      break;
    default:
      break;
  }

  // データを取得し、カウントの降順でソートし、最大10曲まで取得
  const { data, error } = await query
    .order("count", { ascending: false })
    .limit(10);

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  return (data as Song[]) || [];
};

export default getTrendSongs;
