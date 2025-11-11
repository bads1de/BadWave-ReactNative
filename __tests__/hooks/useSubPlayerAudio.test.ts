import { renderHook } from "@testing-library/react";
import { useSubPlayerAudio } from "@/hooks/useSubPlayerAudio";

jest.mock("expo-av", () => ({
  Audio: {
    Sound: {
      createAsync: jest.fn(),
    },
    setAudioModeAsync: jest.fn(),
  },
  InterruptionModeIOS: {
    DoNotMix: 0,
  },
  InterruptionModeAndroid: {
    DoNotMix: 0,
  },
}));

jest.mock("@/hooks/useSubPlayerStore", () => ({
  useSubPlayerStore: jest.fn(),
}));

const { useSubPlayerStore } = require("@/hooks/useSubPlayerStore");
const { Audio } = require("expo-av");

describe("useSubPlayerAudio", () => {
  const mockSongs = [
    {
      id: "song1",
      title: "Test Song 1",
      author: "Artist 1",
      song_path: "https://example.com/song1.mp3",
      image_path: "https://example.com/image1.jpg",
      video_path: null,
      lyrics: null,
      genre: "pop",
      created_at: "2024-01-01",
      like_count: 0,
    },
    {
      id: "song2",
      title: "Test Song 2",
      author: "Artist 2",
      song_path: "https://example.com/song2.mp3",
      image_path: "https://example.com/image2.jpg",
      video_path: null,
      lyrics: null,
      genre: "rock",
      created_at: "2024-01-02",
      like_count: 5,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    useSubPlayerStore.mockReturnValue({
      songs: mockSongs,
      currentSongIndex: 0,
      previewDuration: 30000,
      autoPlay: true,
      setCurrentSongIndex: jest.fn(),
    });

    Audio.setAudioModeAsync.mockResolvedValue(undefined);
  });

  it("initializes with default state", () => {
    const { result } = renderHook(() => useSubPlayerAudio());

    expect(result.current).toHaveProperty("isPlaying");
    expect(result.current).toHaveProperty("currentPosition");
    expect(result.current).toHaveProperty("duration");
    expect(result.current).toHaveProperty("togglePlayPause");
    expect(result.current).toHaveProperty("seekTo");
    expect(result.current).toHaveProperty("stopAndUnloadCurrentSound");
  });

  it("returns expected initial values", () => {
    const { result } = renderHook(() => useSubPlayerAudio());

    expect(result.current.isPlaying).toBe(false);
    expect(result.current.currentPosition).toBe(0);
    expect(result.current.duration).toBe(0);
  });
});
