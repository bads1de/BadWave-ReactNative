import { mapSongRowToSong } from "@/lib/utils/songMapper";

describe("songMapper", () => {
  const baseRow = {
    id: "song-1",
    userId: "user-1",
    title: "Test Song",
    author: "Test Artist",
    songPath: "/local/song.mp3",
    originalSongPath: "https://cdn.example.com/song.mp3",
    imagePath: "/local/art.jpg",
    originalImagePath: "https://cdn.example.com/art.jpg",
    videoPath: "/local/video.mp4",
    originalVideoPath: "https://cdn.example.com/video.mp4",
    duration: 180,
    genre: "pop",
    lyrics: "la la",
    playCount: 12,
    likeCount: 7,
    createdAt: "2026-03-19T00:00:00.000Z",
  };

  it("prefers local paths by default", () => {
    const song = mapSongRowToSong(baseRow);

    expect(song).toMatchObject({
      id: "song-1",
      user_id: "user-1",
      song_path: "/local/song.mp3",
      image_path: "/local/art.jpg",
      video_path: "/local/video.mp4",
      local_song_path: "/local/song.mp3",
      local_image_path: "/local/art.jpg",
      local_video_path: "/local/video.mp4",
      count: "12",
      like_count: "7",
      created_at: "2026-03-19T00:00:00.000Z",
      duration: 180,
    });
  });

  it("can prefer original paths when requested", () => {
    const song = mapSongRowToSong(baseRow, {
      preferOriginalPaths: true,
    });

    expect(song).toMatchObject({
      song_path: "https://cdn.example.com/song.mp3",
      image_path: "https://cdn.example.com/art.jpg",
      video_path: "https://cdn.example.com/video.mp4",
      local_song_path: "/local/song.mp3",
      local_image_path: "/local/art.jpg",
      local_video_path: "/local/video.mp4",
    });
  });

  it("falls back to empty strings and undefined when paths are missing", () => {
    const song = mapSongRowToSong({
      id: "song-2",
      userId: "user-2",
      title: "Fallback Song",
      author: "Fallback Artist",
    });

    expect(song.song_path).toBe("");
    expect(song.image_path).toBe("");
    expect(song.video_path).toBeUndefined();
    expect(song.count).toBe("0");
    expect(song.like_count).toBe("0");
    expect(song.created_at).toBe("");
  });
});
