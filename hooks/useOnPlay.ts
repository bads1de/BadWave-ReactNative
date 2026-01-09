import { useCallback } from "react";
import { supabase } from "@/lib/supabase";
import usePlayHistory from "@/hooks/usePlayHistory";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

/**
 * 曲の再生回数を更新するカスタムフック
 * シンプルな実装で確実に再生回数を更新します
 * @returns {function} 曲のIDを受け取り、再生回数を更新する関数
 */
const useOnPlay = () => {
  const { isOnline } = useNetworkStatus();
  const playHistory = usePlayHistory();

  // 再生回数を更新する関数
  const onPlay = useCallback(
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
        // 改善: 1回のRPC呼び出しでアトミックにカウントアップ
        const { error: rpcError } = await supabase.rpc(
          "increment_song_play_count",
          { song_id: id }
        );

        if (rpcError) {
          console.error("RPC Error:", rpcError);
          return false;
        }

        // 再生履歴に追加
        await playHistory.recordPlay(id);

        return true;
      } catch (error) {
        console.error("再生回数更新中に予期せぬエラーが発生しました:", error);
        return false;
      }
    },
    [playHistory, isOnline] // Added isOnline to dependencies
  );

  return onPlay;
};

export default useOnPlay;
