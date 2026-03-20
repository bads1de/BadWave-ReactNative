import { useQueryClient } from "@tanstack/react-query";
import { eq, sql } from "drizzle-orm";
import { supabase } from "@/lib/supabase";
import usePlayHistory from "@/hooks/audio/usePlayHistory";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useStableCallback } from "@/hooks/common/useStableCallback";
import { db } from "@/lib/db/client";
import { songs } from "@/lib/db/schema";
import { CACHED_QUERIES } from "@/constants";
import { withSupabaseRetry } from "@/lib/utils/retry";

const PLAYBACK_QUERY_KEYS = [
  [CACHED_QUERIES.songs],
  [CACHED_QUERIES.song],
  [CACHED_QUERIES.songsByGenre],
  [CACHED_QUERIES.playlistSongs],
  [CACHED_QUERIES.trendsSongs],
  [CACHED_QUERIES.topPlayedSongs],
  [CACHED_QUERIES.getRecommendations],
] as const;

async function updateLocalPlayStats(songId: string) {
  try {
    await db
      .update(songs)
      .set({
        playCount: sql`${songs.playCount} + 1`,
        lastPlayedAt: new Date(),
      })
      .where(eq(songs.id, songId));
  } catch (error) {
    console.error("[Play] local play_count update failed:", error);
  }
}

/**
 * 曲の再生回数を更新するカスタムフック
 * シンプルな実装で確実に再生回数を更新します
 * @returns {function} 曲のIDを受け取り、再生回数を更新する関数
 */
const useOnPlay = () => {
  const { isOnline } = useNetworkStatus();
  const playHistory = usePlayHistory();
  const queryClient = useQueryClient();

  // 再生回数を更新する関数
  const onPlay = useStableCallback(
    async (id: string) => {
      // オフライン時は実行しない
      if (!isOnline) {
        return false;
      }

      if (!id) {
        console.error("再生回数更新エラー: IDが指定されていません");
        return false;
      }

      try {
        // Supabase 側の再生回数をアトミックに更新
        const { error: rpcError } = await withSupabaseRetry(() =>
          supabase.rpc("increment_song_play_count", { song_id: id }),
        );

        if (rpcError) {
          console.error("RPC Error:", rpcError);
          return false;
        }

        // ローカルSQLiteと再生履歴を更新
        await Promise.allSettled([
          updateLocalPlayStats(id),
          playHistory.recordPlay(id),
        ]);

        // 反映中のローカル/リモート query を更新
        await Promise.allSettled(
          PLAYBACK_QUERY_KEYS.map((queryKey) =>
            queryClient.invalidateQueries({ queryKey }),
          ),
        );

        return true;
      } catch (error) {
        console.error("再生回数更新中に予期せぬエラーが発生しました:", error);
        return false;
      }
    },
  );

  return onPlay;
};

export default useOnPlay;

