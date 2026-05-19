import { subMonths, subWeeks, subDays } from "date-fns";

/**
 * トレンド期間に基づいて日付フィルターを返す共通ヘルパー
 *
 * useSyncTrendSongs と useGetTrendSongs で重複していた
 * switch (period) ロジックを共通化。
 *
 * @param period - 期間 ("all" | "month" | "week" | "day")
 * @returns ISO日付文字列、または "all" の場合は null
 */
export function getTrendDateFilter(
  period: "all" | "month" | "week" | "day",
): string | null {
  switch (period) {
    case "month":
      return subMonths(new Date(), 1).toISOString();
    case "week":
      return subWeeks(new Date(), 1).toISOString();
    case "day":
      return subDays(new Date(), 1).toISOString();
    default:
      return null;
  }
}
