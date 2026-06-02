export type SongType = "regular";

export default interface Song {
  id: string;
  user_id: string;
  author: string;
  title: string;
  song_path: string;
  image_path: string;
  video_path?: string;
  genre?: string;
  count?: string;
  like_count?: string;
  lyrics?: string;
  created_at: string;
  local_song_path?: string;
  local_image_path?: string;
  local_video_path?: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  image_path?: string;
  title: string;
  songs?: Song[];
  is_public: boolean;
  created_at: string;
  user_name?: string;
}

export interface PlaylistSong {
  id: string;
  user_id: string;
  playlist_id: string;
  song_id?: string;
  suno_song_id?: string;
  song_type: SongType;
}

export interface Spotlight {
  id: string;
  video_path: string;
  title: string;
  author: string;
  genre?: string;
  description?: string;
  thumbnail_path?: string;
  created_at?: string;
}

// ============================================================================
// 共通型定義
// ============================================================================

/**
 * アイコンコンポーネントの型
 * lucide-reactやreact-iconsなどのアイコンライブラリと互換性のある型
 */
export type IconComponent = React.ComponentType<Record<string, unknown>>;

/**
 * テーマカラーの型
 */
export interface ThemeColors {
  primary: string;
  text: string;
  subText: string;
  background: string;
  card: string;
  border: string;
  glow?: string;
}
