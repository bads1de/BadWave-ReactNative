import Song from "@/types";
import { supabase } from "@/lib/supabase";

/**
 * ユーザーにおすすめの曲を取得する
 *
 * @param {number} limit 取得する曲の数
 * @returns {Promise<Song[]>} おすすめ曲の配列
 * @throws {Error} データベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * const recommendations = await getRecommendations(10);
 * console.log(recommendations);
 * ```
 */
const getRecommendations = async (limit: number = 10): Promise<Song[]> => {
  // 現在のユーザーセッションを取得
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.user?.id) {
    console.log("No user session found for recommendations");
    return [];
  }

  try {
    // 推薦曲を取得するファンクションを呼び出す
    const { data, error } = await supabase.rpc("get_recommendations", {
      p_user_id: session.user.id,
      p_limit: limit,
    });

    if (error) {
      console.error("Error fetching recommendations:", error);
      throw new Error(error.message);
    }

    // データがない場合は空配列を返す
    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log("No recommendation data found for user", session.user.id);
      return [];
    }

    // データを整形して返す
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      author: item.author,
      song_path: item.song_path,
      image_path: item.image_path,
      genre: item.genre,
      count: item.count || 0,
      like_count: item.like_count || 0,
      created_at: item.created_at,
      user_id: session.user.id,
      recommendation_score: item.score,
    }));
  } catch (e) {
    console.error("Exception in getRecommendations:", e);
    return [];
  }
};

export default getRecommendations;
