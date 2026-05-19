import { db } from "@/lib/db/client";
import { sectionCache } from "@/lib/db/schema";

/**
 * sectionCacheにIDリストをupsertする共通ヘルパー
 *
 * useSyncTrendSongs と useSyncRecommendations で重複していた
 * sectionCache upsert ロジックを共通化。
 *
 * @param key - キャッシュキー
 * @param itemIds - 保存するIDの配列
 */
export async function upsertSectionCache(
  key: string,
  itemIds: string[],
): Promise<void> {
  await db
    .insert(sectionCache)
    .values({
      key,
      itemIds,
      updatedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: sectionCache.key,
      set: {
        itemIds,
        updatedAt: new Date(),
      },
    });
}
