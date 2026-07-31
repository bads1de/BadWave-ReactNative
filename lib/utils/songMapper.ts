import Song from "@/types";
import { SongRow, SongInsertRow } from "@/lib/db/schema";

/**
 * SQLite の song 行の入力型。
 * 必須コア列 + 任意の残り列 (schema の SongRow から派生)。
 */
export type SongRowInput = Pick<SongRow, "id" | "userId" | "title" | "author"> &
  Partial<Omit<SongRow, "id" | "userId" | "title" | "author">>;

export type MappedSong = Song & {
  duration?: number;
};

export interface MapSongOptions {
  /**
   * true の場合は original_* を優先し、false の場合はローカルパスを優先する。
   */
  preferOriginalPaths?: boolean;
}

function resolveSongPath(
  localPath: string | null | undefined,
  originalPath: string | null | undefined,
  preferOriginalPaths: boolean,
) {
  return preferOriginalPaths
    ? originalPath ?? localPath ?? ""
    : localPath ?? originalPath ?? "";
}

function resolveVideoPath(
  localPath: string | null | undefined,
  originalPath: string | null | undefined,
  preferOriginalPaths: boolean,
) {
  return preferOriginalPaths
    ? originalPath ?? localPath ?? undefined
    : localPath ?? originalPath ?? undefined;
}

/**
 * SQLite の song レコードを UI で使う Song 型に変換する。
 * ローカル再生用に local_* も同時に埋める。
 */
export function mapSongRowToSong(
  row: SongRowInput,
  options: MapSongOptions = {},
): MappedSong {
  const preferOriginalPaths = options.preferOriginalPaths ?? false;

  return {
    id: row.id,
    user_id: row.userId,
    title: row.title,
    author: row.author,
    song_path: resolveSongPath(
      row.songPath,
      row.originalSongPath,
      preferOriginalPaths,
    ),
    image_path: resolveSongPath(
      row.imagePath,
      row.originalImagePath,
      preferOriginalPaths,
    ),
    video_path: resolveVideoPath(
      row.videoPath,
      row.originalVideoPath,
      preferOriginalPaths,
    ),
    genre: row.genre ?? undefined,
    lyrics: row.lyrics ?? undefined,
    count: String(row.playCount ?? 0),
    like_count: String(row.likeCount ?? 0),
    created_at: row.createdAt ?? "",
    local_song_path: row.songPath ?? undefined,
    local_image_path: row.imagePath ?? undefined,
    local_video_path: row.videoPath ?? undefined,
    duration: row.duration ?? undefined,
  };
}

/**
 * UI の Song 型を SQLite の挿入行に変換する (mapSongRowToSong の逆方向)。
 */
export function mapSongToRow(song: MappedSong): SongInsertRow {
  return {
    id: song.id,
    userId: song.user_id,
    title: song.title,
    author: song.author,
    songPath: song.local_song_path ?? null,
    imagePath: song.local_image_path ?? null,
    videoPath: song.local_video_path ?? null,
    originalSongPath: song.song_path ?? null,
    originalImagePath: song.image_path ?? null,
    originalVideoPath: song.video_path ?? null,
    duration: typeof song.duration === "number" ? song.duration : null,
    genre: song.genre ?? null,
    lyrics: song.lyrics ?? null,
    createdAt: song.created_at,
    playCount: parseInt(String(song.count ?? 0), 10) || 0,
    likeCount: parseInt(String(song.like_count ?? 0), 10) || 0,
  };
}

