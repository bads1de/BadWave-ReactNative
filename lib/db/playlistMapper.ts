import { Playlist } from "@/types";
import { PlaylistRow, PlaylistInsertRow } from "@/lib/db/schema";

/**
 * SQLite のプレイリスト行を Playlist 型に変換する
 *
 * useGetPlaylists と useGetLocalPlaylist で重複していた
 * マッピングロジックを共通化。
 *
 * @param row - SQLite から取得したプレイリスト行
 * @returns Playlist 型のオブジェクト
 */
export function mapPlaylistRowToPlaylist(row: PlaylistRow): Playlist {
  return {
    id: row.id,
    user_id: row.userId,
    title: row.title,
    image_path: row.imagePath ?? undefined,
    is_public: row.isPublic ?? false,
    created_at: row.createdAt ?? "",
  };
}

/**
 * UI の Playlist 型を SQLite の挿入行に変換する (mapPlaylistRowToPlaylist の逆方向)。
 */
export function mapPlaylistToRow(playlist: Playlist): PlaylistInsertRow {
  return {
    id: playlist.id,
    userId: playlist.user_id,
    title: playlist.title,
    imagePath: playlist.image_path ?? null,
    isPublic: playlist.is_public,
    createdAt: playlist.created_at,
  };
}
