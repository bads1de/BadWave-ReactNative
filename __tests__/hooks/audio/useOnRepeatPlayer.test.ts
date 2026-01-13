import { renderHook, act } from "@testing-library/react";
import { useOnRepeatPlayer } from "@/hooks/audio/useOnRepeatPlayer";
import Song from "@/types";

// expo-video をモック
jest.mock("expo-video", () => ({
  useVideoPlayer: jest.fn(),
}));

import { useVideoPlayer } from "expo-video";

describe("useOnRepeatPlayer", () => {
  const mockVideoPlayer = {
    play: jest.fn(),
    pause: jest.fn(),
    loop: false,
    duration: 180, // 3分の曲
    currentTime: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useVideoPlayer as jest.Mock).mockReturnValue(mockVideoPlayer);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("動画付きの曲の場合", () => {
    const songWithVideo: Song = {
      id: "1",
      title: "Video Song",
      author: "Artist",
      image_path: "https://example.com/image.jpg",
      song_path: "https://example.com/song.mp3",
      video_path: "https://example.com/video.mp4",
    };

    it("expo-video を使用すること", () => {
      renderHook(() => useOnRepeatPlayer(songWithVideo, true));
      expect(useVideoPlayer).toHaveBeenCalledWith(
        songWithVideo.video_path,
        expect.any(Function)
      );
    });

    it("isVisible が true の場合、ランダム位置にシークして再生すること", () => {
      renderHook(() => useOnRepeatPlayer(songWithVideo, true));

      // タイマーを進めてシークを実行
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // currentTimeが設定されていることを確認（ランダム位置にシーク）
      // duration が 180 の場合、20%〜80% = 36〜144 秒の間
      expect(mockVideoPlayer.currentTime).toBeGreaterThanOrEqual(36);
      expect(mockVideoPlayer.currentTime).toBeLessThanOrEqual(144);
      expect(mockVideoPlayer.play).toHaveBeenCalled();
    });

    it("isVisible が false の場合、一時停止すること", () => {
      renderHook(() => useOnRepeatPlayer(songWithVideo, false));
      expect(mockVideoPlayer.pause).toHaveBeenCalled();
    });
  });

  describe("プレイヤーインスタンスの返却", () => {
    const song: Song = {
      id: "3",
      title: "Test Song",
      author: "Artist",
      image_path: "https://example.com/image.jpg",
      song_path: "https://example.com/song.mp3",
      video_path: "https://example.com/video.mp4",
    };

    it("player オブジェクトを返すこと", () => {
      const { result } = renderHook(() => useOnRepeatPlayer(song, true));
      expect(result.current.player).toBeDefined();
    });

    it("hasVideo フラグを返すこと", () => {
      const { result } = renderHook(() => useOnRepeatPlayer(song, true));
      expect(result.current.hasVideo).toBe(true);
    });
  });
});
