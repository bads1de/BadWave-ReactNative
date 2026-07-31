import recordPlayAction from "@/actions/user/recordPlay";
import { useUser } from "@/hooks/data/useUser";
import { useCallback, useMemo } from "react";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";

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

      await recordPlayAction(songId, user.id);
    },
    [isOnline, user?.id],
  );

  return useMemo(() => ({ recordPlay }), [recordPlay]);
};

export default usePlayHistory;
