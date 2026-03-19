import Song from "@/types";

export type SongRowLike = {
  id: string;
  userId: string;
  title: string;
  author: string;
  songPath?: string | null;
  originalSongPath?: string | null;
  imagePath?: string | null;
  originalImagePath?: string | null;
  videoPath?: string | null;
  originalVideoPath?: string | null;
  duration?: number | null;
  genre?: string | null;
  lyrics?: string | null;
  playCount?: number | null;
  likeCount?: number | null;
  createdAt?: string | null;
};

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
  row: SongRowLike,
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

