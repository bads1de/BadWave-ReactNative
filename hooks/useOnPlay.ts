import { useCallback } from "react";
import { supabase } from "@/lib/supabase";

/**
 * 曲の再生回数を更新するカスタムフック
 * シンプルな実装で確実に再生回数を更新します
 * @returns {function} 曲のIDを受け取り、再生回数を更新する関数
 */
const useOnPlay = () => {
  // 再生回数を更新する関数
  const onPlay = useCallback(async (id: string) => {
    if (!id) {
      console.error("再生回数更新エラー: IDが指定されていません");
      return false;
    }

    try {
      // 1. 現在の曲データを取得
      const { data: songData, error: fetchError } = await supabase
        .from("songs")
        .select("id, count")
        .eq("id", id)
        .single();

      if (fetchError) {
        console.error("曲データ取得エラー:", fetchError.message);
        return false;
      }

      if (!songData) {
        console.error("曲データが見つかりません:", id);
        return false;
      }

      // 2. 再生回数をインクリメント
      const newCount = Number(songData.count) + 1;

      // 3. 更新を実行
      const { data: updatedData, error: updateError } = await supabase
        .from("songs")
        .update({ count: newCount })
        .eq("id", id)
        .select()
        .single();

      if (updateError) {
        return false;
      }

      return true;
    } catch (error) {
      console.error("再生回数更新中に予期せぬエラーが発生しました:", error);
      return false;
    }
  }, []);

  return onPlay;
};

export default useOnPlay;
