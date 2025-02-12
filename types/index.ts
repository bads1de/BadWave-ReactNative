//Todo: DBからURLを取得するので、型を変更する

export type SongType = "regular" | "suno";

export default interface Song {
  id: string;
  user_id: string;
  author: string;
  title: string;
  song_path: any;
  image_path: string;
  video_path?: string;
  genre?: string;
  count?: string;
  like_count?: string;
  lyrics?: string;
  created_at: string;
}

export interface Playlist {
  id: string;
  user_id: string;
  image_path?: string;
  title: string;
  songs?: any[];
}

export default interface PlaylistSong {
  id: string;
  user_id: string;
  playlist_id: string;
  song_id?: string;
  suno_song_id?: string;
  song_type: SongType;
}
