import { supabase } from "../lib/supabase";
import getSongById from "./getSongById";
import updatePlaylistImage from "./updatePlaylistImage";

/**
 * プレイリストに曲を追加する関数
 *
 * @remarks
 * この関数は指定されたプレイリストに曲を追加し、必要に応じてプレイリストの画像を更新します。
 */

interface AddPlaylistSongProps {
  playlistId: string;
  userId: string;
  songId: string;
}

/**
 * プレイリストに曲を追加する
 *
 * @param props - 必要なパラメータを含むオブジェクト
 * @returns プレイリストIDと追加された曲のデータを含むオブジェクト
 * @throws データベースエラーが発生した場合
 *
 * @example
 * ```typescript
 * await addPlaylistSong({ playlistId: 'playlist-id-123', songId: 'song-id-456', userId: 'user-id-789' });
 * ```
 */
const addPlaylistSong = async ({
  playlistId,
  userId,
  songId,
}: AddPlaylistSongProps) => {
  // データベースにプレイリスト曲情報を挿入
  const { error } = await supabase.from("playlist_songs").insert({
    playlist_id: playlistId,
    user_id: userId,
    song_id: songId,
    song_type: "regular", // 通常の曲タイプとして登録
  });

  // エラーハンドリング
  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  // 追加した曲の詳細情報を取得
  const songData = await getSongById(songId);

  // 曲に画像がある場合、プレイリストの画像を更新
  if (songData?.image_path) {
    await updatePlaylistImage(playlistId, songData.image_path);
  }

  // プレイリストIDと曲データを返却
  return { playlistId, songData };
};

export default addPlaylistSong;
