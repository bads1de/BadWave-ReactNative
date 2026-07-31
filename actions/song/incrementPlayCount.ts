import { eq, sql } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { withSupabaseRetry } from "@/lib/utils/retry";
import { getErrorMessage } from "@/lib/utils/error";

/**
 * 曲の再生回数を Supabase（RPC）とローカルSQLiteの両方に反映する
 *
 * @param {string} songId 曲のID
 * @throws {Error} RPCの呼び出しに失敗した場合
 */
const incrementPlayCount = async (songId: string): Promise<void> => {
  // Supabase 側の再生回数をアトミックに更新（リトライ付き）
  const { error } = await withSupabaseRetry(async () =>
    supabase.rpc("increment_song_play_count", { song_id: songId })
  );

  if (error) {
    throw new Error(getErrorMessage(error));
  }

  // ローカルSQLiteの再生回数も更新（失敗しても致命的ではないため握りつぶす）
  try {
    await db
      .update(songs)
      .set({
        playCount: sql`${songs.playCount} + 1`,
        lastPlayedAt: new Date(),
      })
      .where(eq(songs.id, songId));
  } catch (localError) {
    console.error("[Play] local play_count update failed:", localError);
  }
};

export default incrementPlayCount;
