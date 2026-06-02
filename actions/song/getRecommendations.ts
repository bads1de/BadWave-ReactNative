import Song from "@/types";
import { supabase } from "@/lib/supabase";

/**
 * ユーザーにおすすめの曲を取得する
 *
 * @param {string} userId ユーザーID
 * @param {number} limit 取得する曲の数
 * @returns {Promise<Song[]>} おすすめ曲の配列
 * @throws {Error} データベースクエリに失敗した場合
 */
const getRecommendations = async (
  userId: string,
  limit: number = 10
): Promise<Song[]> => {
  try {
    const { data, error } = await supabase.rpc("get_recommendations", {
      p_user_id: userId,
      p_limit: limit,
    });

    if (error) {
      console.error("Error fetching recommendations:", error);
      throw new Error(error.message);
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    return data.map((item: Record<string, unknown>) => ({
      id: item.id as string,
      title: item.title as string,
      author: item.author as string,
      song_path: item.song_path as string,
      image_path: item.image_path as string,
      genre: item.genre as string,
      count: String(item.count || 0),
      like_count: String(item.like_count || 0),
      created_at: item.created_at as string,
      user_id: userId,
      recommendation_score: item.score as number,
    }));
  } catch (e) {
    console.error("Exception in getRecommendations:", e);
    return [];
  }
};

export default getRecommendations;
