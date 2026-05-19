import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { playlists } from "@/lib/db/schema";

interface CreatePlaylistParams {
  userId: string;
  title: string;
  isPublic?: boolean;
}

/**
 * 新しいプレイリストを作成する
 * Supabase に作成し、SQLite にも同期する
 *
 * @param params.userId ユーザーID
 * @param params.title プレイリストタイトル
 * @param params.isPublic 公開設定 (デフォルト: false)
 * @returns 作成されたプレイリストデータ
 * @throws {Error} データベースクエリに失敗した場合
 */
const createPlaylist = async ({
  userId,
  title,
  isPublic = false,
}: CreatePlaylistParams) => {
  const { data, error } = await supabase
    .from("playlists")
    .insert({
      user_id: userId,
      title: title.trim(),
      is_public: isPublic,
    })
    .select()
    .single();

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  await db.insert(playlists).values({
    id: data.id,
    userId,
    title: title.trim(),
    imagePath: data.image_path,
    isPublic,
    createdAt: data.created_at,
  });

  return data;
};

export default createPlaylist;
