import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import Song from "@/types";
import {
  convertSongToTrack,
  getOfflineStorageService,
} from "@/hooks/TrackPlayer/utils";

// 既存のモック設定
jest.mock("@/hooks/TrackPlayer/utils", () => {
  const originalModule = jest.requireActual("@/hooks/TrackPlayer/utils");
  return {
    ...originalModule,
    getOfflineStorageService: jest.fn(),
  };
});

describe("Metadata Persistence", () => {
  const mockSong: Song = {
    id: "song-metadata-test",
    title: "Metadata Test Song",
    author: "Test Artist",
    image_path: "https://example.com/image.jpg",
    song_path: "https://example.com/song.mp3",
    user_id: "user-123",
    created_at: "2023-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    (getOfflineStorageService as jest.Mock).mockReturnValue({
      getSongLocalPath: jest.fn().mockResolvedValue(null),
    });
  });

  it("should preserve the original Song object within the Track object", async () => {
    const track = await convertSongToTrack(mockSong);

    // Track型には通常 originalSong はないが、カスタムプロパティとして保持させたい
    // これにより、songMapがない環境でもSong情報を復元できる
    expect(track).toHaveProperty("originalSong");
    expect((track as any).originalSong).toEqual(mockSong);
  });
});
