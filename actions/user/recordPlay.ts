import { supabase } from "@/lib/supabase";
import { withSupabaseRetry } from "@/lib/utils/retry";

/**
 * 再生履歴を Supabase に記録する
 *
 * @param {string} songId 曲のID
 * @param {string} userId ユーザーID
 * @returns {Promise<void>} 記録が完了したら解決される
 */
const recordPlay = async (songId: string, userId: string): Promise<void> => {
  const { error } = await withSupabaseRetry(async () =>
    supabase.from("play_history").insert({ user_id: userId, song_id: songId })
  );

  if (error) {
    console.error("再生の記録中にエラーが発生しました:", error);
  }
};

export default recordPlay;
