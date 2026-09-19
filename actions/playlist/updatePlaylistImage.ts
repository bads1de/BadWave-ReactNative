import { supabase } from "@/lib/supabase";
import { SUPABASE_TABLES } from "@/constants";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { playlists } from "@/lib/db/schema";
import { runQuery } from "@/lib/utils/supabaseQuery";

/**
 * プレイリストの画像パスを更新する関数。
 * プレイリストの画像パスが空の場合のみ、指定された曲の画像パスで更新する。
 * これにより、プレイリストに最初に追加された曲の画像がプレイリストのサムネイルとして使用される。
 *
 * @param {string} playlistId プレイリストID - 更新対象のプレイリストを特定するためのID
 * @param {string} songImagePath 曲の画像パス - プレイリストのサムネイルとして設定する画像のパス
 * @returns {Promise<void>} 処理が成功した場合は何も返さない。エラーが発生した場合は例外をスローする。
 */

const updatePlaylistImage = async (
  playlistId: string,
  songImagePath: string
): Promise<void> => {
  // プレイリストの現在の画像パス情報を取得（image_path 列のみ）
  const playlistData = await runQuery(async () =>
    supabase
      .from(SUPABASE_TABLES.playlists)
      .select("image_path")
      .eq("id", playlistId)
      .single(),
  );

  // 画像パスが未設定の場合のみ、指定された曲の画像で更新する
  if (playlistData && !playlistData.image_path) {
    await runQuery(async () =>
      supabase
        .from(SUPABASE_TABLES.playlists)
        .update({ image_path: songImagePath })
        .eq("id", playlistId),
    );

    await db
      .update(playlists)
      .set({ imagePath: songImagePath })
      .where(eq(playlists.id, playlistId));
  }
  // 既に画像パスが設定されている場合は何もしない（最初に追加された曲の画像を維持）
};

export default updatePlaylistImage;
