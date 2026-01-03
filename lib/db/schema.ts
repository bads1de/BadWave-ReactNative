import {
  sqliteTable,
  text,
  real,
  integer,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";

/**
 * 1. Songs: 楽曲のマスターデータ
 *  メタデータとローカルパスの両方を管理します。
 */
export const songs = sqliteTable(
  "songs",
  {
    id: text("id").primaryKey(), // SupabaseのUUID
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    author: text("author").notNull(),

    // ローカルファイルパス (nullなら未ダウンロード)
    songPath: text("song_path"),
    imagePath: text("image_path"),
    videoPath: text("video_path"),

    // オリジナルのリモートURL
    originalSongPath: text("original_song_path"),
    originalImagePath: text("original_image_path"),
    originalVideoPath: text("original_video_path"),

    duration: real("duration"),
    genre: text("genre"),
    lyrics: text("lyrics"),

    // 管理用フィールド
    createdAt: text("created_at"), // SupabaseのISO文字列
    downloadedAt: integer("downloaded_at", { mode: "timestamp" }),
    lastPlayedAt: integer("last_played_at", { mode: "timestamp" }),
    playCount: integer("play_count").default(0),
    likeCount: integer("like_count").default(0),
  },
  (table) => ({
    // パフォーマンス最適化: よく使われるカラムにインデックス
    userIdIdx: index("songs_user_id_idx").on(table.userId),
    genreIdx: index("songs_genre_idx").on(table.genre),
    playCountIdx: index("songs_play_count_idx").on(table.playCount),
    likeCountIdx: index("songs_like_count_idx").on(table.likeCount),
  })
);

/**
 * 2. Playlists: プレイリスト
 */
export const playlists = sqliteTable("playlists", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  title: text("title").notNull(),
  imagePath: text("image_path"),
  isPublic: integer("is_public", { mode: "boolean" }).default(false),
  createdAt: text("created_at"),
});

/**
 * 3. Playlist Songs: プレイリスト内楽曲（中間テーブル）
 */
export const playlistSongs = sqliteTable(
  "playlist_songs",
  {
    id: text("id").primaryKey(),
    playlistId: text("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    addedAt: text("added_at"),
  },
  (table) => ({
    // パフォーマンス最適化: JOINクエリ用インデックス
    playlistIdIdx: index("playlist_songs_playlist_id_idx").on(table.playlistId),
    songIdIdx: index("playlist_songs_song_id_idx").on(table.songId),
  })
);

/**
 * 4. Liked Songs: いいね
 */
export const likedSongs = sqliteTable(
  "liked_songs",
  {
    userId: text("user_id").notNull(),
    songId: text("song_id")
      .notNull()
      .references(() => songs.id, { onDelete: "cascade" }),
    likedAt: text("liked_at").default("now"),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.userId, table.songId] }),
  })
);

/**
 * 5. Spotlights: スポットライト（リール動画）
 */
export const spotlights = sqliteTable("spotlights", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  author: text("author").notNull(),
  description: text("description"),
  genre: text("genre"),

  // リモートURL
  originalVideoPath: text("original_video_path"),
  originalThumbnailPath: text("original_thumbnail_path"),

  // ローカルパス
  videoPath: text("video_path"),
  thumbnailPath: text("thumbnail_path"),

  createdAt: text("created_at"),
  downloadedAt: integer("downloaded_at", { mode: "timestamp" }),
});

/**
 * 6. Section Cache: セクションデータ（トレンド等の並び順キャッシュ）
 * key: "home_trends", "home_for_you" など
 */
export const sectionCache = sqliteTable("section_cache", {
  key: text("key").primaryKey(),
  itemIds: text("item_ids", { mode: "json" }), // string[]
  updatedAt: integer("updated_at", { mode: "timestamp" }).$onUpdate(
    () => new Date()
  ),
});
