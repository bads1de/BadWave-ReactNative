import { supabase } from "@/lib/supabase";
import { useUser } from "@/actions/getUser";
import { useCallback } from "react";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

/**
 * 再生履歴を管理するカスタムフック
 * オフライン時は記録をスキップし、オンライン時のみ Supabase に送信
 * @returns {{recordPlay: (songId: string) => Promise<void>}} 再生を記録する関数を含むオブジェクト
 */
const usePlayHistory = () => {
  const { data: user } = useUser();
  const { isOnline } = useNetworkStatus();

  /**
   * 曲の再生を記録する関数
   * @param {string} songId - 再生された曲のID
   */
  const recordPlay = useCallback(
    async (songId: string) => {
      // オフライン時またはユーザー/曲IDがない場合はスキップ
      if (!isOnline || !user?.id || !songId) return;

      const { error } = await supabase
        .from("play_history")
        .insert({ user_id: user?.id, song_id: songId });

      if (error) {
        console.error("再生の記録中にエラーが発生しました:", error);
      }
    },
    [isOnline, user?.id]
  );

  return { recordPlay };
};

export default usePlayHistory;
