import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { playlists } from "@/lib/db/schema";

/**
 * @fileoverview プレイリスト作成モジュール
 * このモジュールは、新しいプレイリストを作成する機能を提供します。
 */

/**
 * 新しいプレイリストを作成する
 *
 * @param {string} title プレイリストタイトル
 * @returns {Promise<void>}
 * @throws {Error} ユーザーが認証されていない場合、またはデータベースクエリに失敗した場合
 *
 * @example
 * ```typescript
 * await createPlaylist('My New Playlist');
 * ```
 */
const createPlaylist = async (title: string): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  const { data, error } = await supabase
    .from("playlists")
    .insert({
      user_id: session?.user.id,
      title: title.trim(),
    })
    .select()
    .single();

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  await db.insert(playlists).values({
    id: data.id,
    userId: session.user.id,
    title: data.title,
    imagePath: data.image_path,
    isPublic: data.is_public ?? false,
    createdAt: data.created_at,
  });
};

export default createPlaylist;
