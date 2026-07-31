import { useQueryClient } from "@tanstack/react-query";
import incrementPlayCount from "@/actions/song/incrementPlayCount";
import usePlayHistory from "@/hooks/audio/usePlayHistory";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { useStableCallback } from "@/hooks/common/useStableCallback";
import { CACHED_QUERIES } from "@/constants";

const PLAYBACK_QUERY_KEYS = [
  [CACHED_QUERIES.songs],
  [CACHED_QUERIES.song],
  [CACHED_QUERIES.songsByGenre],
  [CACHED_QUERIES.playlistSongs],
  [CACHED_QUERIES.trendsSongs],
  [CACHED_QUERIES.topPlayedSongs],
  [CACHED_QUERIES.getRecommendations],
] as const;

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
        // Supabase / SQLite の再生回数を action 経由で更新
        await incrementPlayCount(id);

        // 再生履歴を更新
        await playHistory.recordPlay(id);

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

