import { Playlist } from "@/types";

/**
 * SQLite のプレイリスト行を Playlist 型に変換する
 *
 * useGetPlaylists と useGetLocalPlaylist で重複していた
 * マッピングロジックを共通化。
 *
 * @param row - SQLite から取得したプレイリスト行
 * @returns Playlist 型のオブジェクト
 */
export function mapPlaylistRowToPlaylist(row: {
  id: string;
  userId: string;
  title: string;
  imagePath: string | null;
  isPublic: boolean | null;
  createdAt: string | null;
}): Playlist {
  return {
    id: row.id,
    user_id: row.userId,
    title: row.title,
    image_path: row.imagePath ?? undefined,
    is_public: row.isPublic ?? false,
    created_at: row.createdAt ?? "",
  };
}
