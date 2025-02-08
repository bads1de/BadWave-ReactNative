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
  }