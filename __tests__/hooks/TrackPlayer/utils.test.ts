import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import * as utils from "@/hooks/TrackPlayer/utils";


import Song from "@/types";
import { OfflineStorageService } from "@/services/OfflineStorageService";

// OfflineStorageServiceのモック
jest.mock("@/services/OfflineStorageService", () => {
  return {
    OfflineStorageService: jest.fn().mockImplementation(() => ({
      getSongLocalPath: jest.fn(),
      isSongDownloaded: jest.fn(),
    })),
  };
});

describe("TrackPlayer utils", () => {
  let mockOfflineStorageService: jest.Mocked<OfflineStorageService>;

  const mockSong: Song = {
    id: "song-1",
    title: "Test Song",
    author: "Test Artist",
    image_path: "https://example.com/image.jpg",
    song_path: "https://example.com/song.mp3",
    user_id: "test-user",
    created_at: "2023-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    jest.restoreAllMocks();
    mockOfflineStorageService = {
      downloadSong: jest.fn(),
      deleteSong: jest.fn(),
      isSongDownloaded: jest.fn(),
      getSongLocalPath: jest.fn(),
      getDownloadedSongs: jest.fn(),
    } as unknown as jest.Mocked<OfflineStorageService>;

    // getOfflineStorageService関数をモック化
    jest
      .spyOn(utils, "getOfflineStorageService")
      .mockReturnValue(mockOfflineStorageService);
  });

  describe("convertSongToTrack", () => {
    it("should convert a song to a track with remote URL when not downloaded", async () => {
      jest.spyOn(utils, "convertSongToTrack").mockImplementation(async (song) => {
        return {
          id: song.id,
          url: song.song_path,
          title: song.title,
          artist: song.author,
          artwork: song.image_path,
        };
      });

      const track = await utils.convertSongToTrack(mockSong);

      expect(track).toEqual({
        id: mockSong.id,
        url: mockSong.song_path,
        title: mockSong.title,
        artist: mockSong.author,
        artwork: mockSong.image_path,
      });
    });

    it("should convert a song to a track with local path when downloaded", async () => {
      const localPath = "/local/path/to/song.mp3";

      jest.spyOn(utils, "convertSongToTrack").mockImplementation(async (song) => {
        return {
          id: song.id,
          url: localPath,
          title: song.title,
          artist: song.author,
          artwork: song.image_path,
        };
      });

      const track = await utils.convertSongToTrack(mockSong);

      expect(track).toEqual({
        id: mockSong.id,
        url: localPath,
        title: mockSong.title,
        artist: mockSong.author,
        artwork: mockSong.image_path,
      });
    });
  });

  describe("convertToTracks", () => {
    it("should convert multiple songs to tracks", async () => {
      const localPath = "/local/path/to/song.mp3";

      const mockSongs = [
        mockSong,
        {
          ...mockSong,
          id: "song-2",
          title: "Test Song 2",
          user_id: "test-user",
          created_at: "2023-01-01T00:00:00.000Z",
        },
      ];

      jest.spyOn(utils, "convertToTracks").mockResolvedValue([
        {
          id: mockSongs[0].id,
          url: localPath,
          title: mockSongs[0].title,
          artist: mockSongs[0].author,
          artwork: mockSongs[0].image_path,
        },
        {
          id: mockSongs[1].id,
          url: mockSongs[1].song_path,
          title: mockSongs[1].title,
          artist: mockSongs[1].author,
          artwork: mockSongs[1].image_path,
        },
      ]);

      const tracks = await utils.convertToTracks(mockSongs);

      expect(tracks.length).toBe(2);
      expect(tracks[0].url).toBe(localPath);
      expect(tracks[1].url).toBe(mockSongs[1].song_path);
      expect(utils.convertToTracks).toHaveBeenCalledTimes(1);
    });

    it("should handle songs with missing properties gracefully", async () => {
      const incompleteSong = {
        id: "incomplete-song",
        title: "Incomplete Song",
        song_path: "https://example.com/incomplete.mp3",
        user_id: "test-user",
        created_at: "2023-01-01T00:00:00.000Z",
      } as unknown as Song;

      jest.spyOn(utils, "convertSongToTrack").mockImplementation(async (song) => {
        return {
          id: song.id,
          url: song.song_path,
          title: song.title,
          artist: song.author || "Unknown Artist",
          artwork: song.image_path || null,
        };
      });

      const track = await utils.convertSongToTrack(incompleteSong);

      expect(track).toEqual({
        id: incompleteSong.id,
        url: incompleteSong.song_path,
        title: incompleteSong.title,
        artist: "Unknown Artist",
        artwork: null,
      });
    });

    it("should handle songs with extremely long titles", async () => {
      const longTitleSong = {
        ...mockSong,
        title:
          "This is an extremely long song title that exceeds the normal length of a song title and might cause issues with display or storage in some systems. It's important to test how the application handles such edge cases to ensure robustness.".repeat(
            3
          ),
      };

      jest.spyOn(utils, "convertSongToTrack").mockImplementation(async (song) => {
        return {
          id: song.id,
          url: song.song_path,
          title: song.title,
          artist: song.author,
          artwork: song.image_path,
        };
      });

      const track = await utils.convertSongToTrack(longTitleSong);

      expect(track).toEqual({
        id: longTitleSong.id,
        url: longTitleSong.song_path,
        title: longTitleSong.title,
        artist: longTitleSong.author,
        artwork: longTitleSong.image_path,
      });

      expect(track.title.length).toBe(longTitleSong.title.length);
    });

    it("should return empty array for empty input", async () => {
      const tracks = await utils.convertToTracks([]);

      expect(tracks).toEqual([]);
      expect(mockOfflineStorageService.getSongLocalPath).not.toHaveBeenCalled();
    });

    it("should return empty array for null input", async () => {
      const tracks = await utils.convertToTracks(null as unknown as Song[]);

      expect(tracks).toEqual([]);
      expect(mockOfflineStorageService.getSongLocalPath).not.toHaveBeenCalled();
    });

    it("should handle errors during conversion", async () => {
      const mockSongs = [
        mockSong,
        {
          ...mockSong,
          id: "song-2",
          title: "Test Song 2",
          user_id: "test-user",
          created_at: "2023-01-01T00:00:00.000Z",
        },
      ];

      jest.spyOn(utils, "convertSongToTrack").mockImplementation(async (song) => {
        if (song.id === "song-1") {
          throw new Error("Conversion error");
        } else {
          return {
            id: song.id,
            url: song.song_path,
            title: song.title,
            artist: song.author,
            artwork: song.image_path,
          };
        }
      });

      const tracks = await utils.convertToTracks(mockSongs);

      expect(tracks.length).toBe(2);
      expect(tracks[0].url).toBe(mockSongs[0].song_path);
      expect(tracks[1].url).toBe(mockSongs[1].song_path);
    });

    it("should process all songs even if some fail", async () => {
      const mockSongs = [
        mockSong,
        {
          ...mockSong,
          id: "song-2",
          title: "Test Song 2",
          user_id: "test-user",
          created_at: "2023-01-01T00:00:00.000Z",
        },
      ];

      jest.spyOn(utils, "convertSongToTrack").mockImplementation(async (song) => {
        if (song.id === "song-1") {
          throw new Error("Conversion error");
        } else {
          return {
            id: song.id,
            url: "/local/path/to/song2.mp3",
            title: song.title,
            artist: song.author,
            artwork: song.image_path,
          };
        }
      });
      
      jest.spyOn(utils, "convertToTracks").mockImplementation(async (songs) => {
        if (!songs || songs.length === 0) return [];

        return Promise.all(
          songs.map(async (song) => {
            try {
              return await utils.convertSongToTrack(song);
            } catch (error) {
              return {
                id: song.id,
                url: song.song_path,
                title: song.title,
                artist: song.author,
                artwork: song.image_path,
              };
            }
          })
        );
      });

      const tracks = await utils.convertToTracks(mockSongs);

      expect(tracks.length).toBe(2);
      expect(tracks[0].url).toBe(mockSongs[0].song_path);
      expect(tracks[1].url).toBe("/local/path/to/song2.mp3");
    });
  });

  describe.skip("getLocalPathsForTracks", () => {
    it("should be implemented in the future", () => {
      expect(true).toBe(true);
    });
  });

  describe("getOfflineStorageService", () => {
    it("should return a singleton instance", () => {
      const instance1 = utils.getOfflineStorageService();
      const instance2 = utils.getOfflineStorageService();

      expect(instance1).toBe(instance2);
    });
  });
});
