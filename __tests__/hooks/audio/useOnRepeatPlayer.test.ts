import { renderHook, act } from "@testing-library/react";
import { useOnRepeatPlayer } from "@/hooks/audio/useOnRepeatPlayer";
import Song from "@/types";

// expo-video をモック
jest.mock("expo-video", () => ({
  useVideoPlayer: jest.fn(),
}));

// useOnRepeatStore をモック
jest.mock("@/hooks/stores/useOnRepeatStore", () => ({
  useOnRepeatStore: jest.fn(),
}));

import { useVideoPlayer } from "expo-video";
import { useOnRepeatStore } from "@/hooks/stores/useOnRepeatStore";

describe("useOnRepeatPlayer", () => {
  let mockVideoPlayer: any;

  beforeEach(() => {
    mockVideoPlayer = {
      play: jest.fn(),
      pause: jest.fn(),
      loop: false,
      duration: 180, // 3分の曲
      currentTime: 0,
    };
    jest.clearAllMocks();
    jest.useFakeTimers();
    (useVideoPlayer as jest.Mock).mockReturnValue(mockVideoPlayer);
    // ストアのモック設定 (0.5を返す)
    (useOnRepeatStore as unknown as jest.Mock).mockImplementation((selector: any) =>
      selector({ startPercentages: { "1": 0.5, "2": 0.5, "3": 0.5 } })
    );
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
      user_id: "user1",
      created_at: "2024-01-01",
    };

    it("expo-video を使用すること", () => {
      renderHook(() => useOnRepeatPlayer(songWithVideo, true));
      expect(useVideoPlayer).toHaveBeenCalledWith(
        songWithVideo.video_path,
        expect.any(Function)
      );
    });

    it("isVisible が true の場合、ストアで指定された位置にシークして再生すること", () => {
      renderHook(() => useOnRepeatPlayer(songWithVideo, true));

      // タイマーを進めてシークを実行
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // duration(180) * startPercentage(0.5) = 90
      expect(mockVideoPlayer.currentTime).toBe(90);
      expect(mockVideoPlayer.play).toHaveBeenCalled();
    });

    it("isVisible が false でも isPreloading が true なら source をセットすること", () => {
      renderHook(() => useOnRepeatPlayer(songWithVideo, false, true));
      expect(useVideoPlayer).toHaveBeenCalledWith(
        songWithVideo.video_path,
        expect.any(Function)
      );
      expect(mockVideoPlayer.play).not.toHaveBeenCalled();
    });

    it("isVisible が false の場合、一時停止すること", () => {
      renderHook(() => useOnRepeatPlayer(songWithVideo, false));
      expect(mockVideoPlayer.pause).toHaveBeenCalled();
    });

    it("Preloading から Visible に遷移した際、即座に再生が開始されること", () => {
      const { rerender } = renderHook(
        ({ isVisible, isPreloading }) =>
          useOnRepeatPlayer(songWithVideo, isVisible, isPreloading),
        {
          initialProps: { isVisible: false, isPreloading: true },
        }
      );

      // プリロード中: シークのみ実行
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(mockVideoPlayer.currentTime).toBe(90);
      expect(mockVideoPlayer.play).not.toHaveBeenCalled();

      // 表示状態に遷移
      rerender({ isVisible: true, isPreloading: true });
      expect(mockVideoPlayer.play).toHaveBeenCalled();
    });

    it("一度シークした後は、isVisible が切り替わっても再シークしないこと", () => {
      // currentTime へのアクセスを追跡できるようにモック
      let currentTime = 0;
      const setCurrentTime = jest.fn((val) => {
        currentTime = val;
      });
      Object.defineProperty(mockVideoPlayer, "currentTime", {
        get: () => currentTime,
        set: setCurrentTime,
        configurable: true,
      });

      const { rerender } = renderHook(
        ({ isVisible }) => useOnRepeatPlayer(songWithVideo, isVisible),
        {
          initialProps: { isVisible: true },
        }
      );

      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(currentTime).toBe(90);
      // 動画と音声の2回設定される（モックでは同じオブジェクトを返しているため）
      expect(setCurrentTime).toHaveBeenCalledTimes(2);

      // 再生位置が進んだと想定
      currentTime = 100;
      setCurrentTime.mockClear();

      // 非表示にして再度表示
      rerender({ isVisible: false });
      rerender({ isVisible: true });

      // currentTime が再設定されていないことを確認
      expect(setCurrentTime).not.toHaveBeenCalled();
      expect(currentTime).toBe(100);
    });

    it("song.id が変わった場合、hasSeekedRef がリセットされ新しくシークすること", () => {
      const { rerender } = renderHook(
        ({ song }) => useOnRepeatPlayer(song, true),
        {
          initialProps: { song: songWithVideo },
        }
      );

      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(mockVideoPlayer.currentTime).toBe(90);

      const newSong: Song = {
        ...songWithVideo,
        id: "2",
        title: "New Song",
      };

      rerender({ song: newSong });

      // 新しい曲でもシークが実行されること
      act(() => {
        jest.advanceTimersByTime(300);
      });
      expect(mockVideoPlayer.currentTime).toBe(90);
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
      user_id: "user1",
      created_at: "2024-01-01",
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
