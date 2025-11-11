import TrackPlayer, {
  State,
  Event,
  Capability,
  AppKilledPlaybackBehavior,
} from "react-native-track-player";
import { setupPlayer, playbackService } from "@/services/PlayerService";

jest.mock("react-native-track-player", () => ({
  setupPlayer: jest.fn(),
  updateOptions: jest.fn(),
  getPlaybackState: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  skipToNext: jest.fn(),
  skipToPrevious: jest.fn(),
  seekTo: jest.fn(),
  addEventListener: jest.fn(),
  State: {
    None: "none",
    Stopped: "stopped",
    Playing: "playing",
    Paused: "paused",
  },
  Event: {
    RemotePlay: "remote-play",
    RemotePause: "remote-pause",
    RemoteStop: "remote-stop",
    RemoteNext: "remote-next",
    RemotePrevious: "remote-previous",
    RemoteSeek: "remote-seek",
    PlaybackError: "playback-error",
  },
  Capability: {
    Play: "play",
    Pause: "pause",
    Stop: "stop",
    SeekTo: "seek-to",
    SkipToNext: "skip-to-next",
    SkipToPrevious: "skip-to-previous",
  },
  AppKilledPlaybackBehavior: {
    PausePlayback: "pause-playback",
  },
}));

describe("PlayerService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("setupPlayer", () => {
    it("プレーヤーがすでにセットアップ済みの場合、再セットアップしない", async () => {
      (TrackPlayer.getPlaybackState as jest.Mock).mockResolvedValue({
        state: State.Playing,
      });

      const result = await setupPlayer();

      expect(result).toBe(true);
      expect(TrackPlayer.setupPlayer).not.toHaveBeenCalled();
      expect(TrackPlayer.updateOptions).not.toHaveBeenCalled();
    });

    it("プレーヤーが未セットアップの場合、新規セットアップを実行", async () => {
      (TrackPlayer.getPlaybackState as jest.Mock).mockResolvedValue({
        state: State.None,
      });
      (TrackPlayer.setupPlayer as jest.Mock).mockResolvedValue(undefined);
      (TrackPlayer.updateOptions as jest.Mock).mockResolvedValue(undefined);

      const result = await setupPlayer();

      expect(result).toBe(true);
      expect(TrackPlayer.setupPlayer).toHaveBeenCalledWith({
        autoHandleInterruptions: true,
      });
      expect(TrackPlayer.updateOptions).toHaveBeenCalledWith({
        android: {
          appKilledPlaybackBehavior: AppKilledPlaybackBehavior.PausePlayback,
        },
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.Stop,
          Capability.SeekTo,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SeekTo,
          Capability.SkipToPrevious,
        ],
      });
    });

    it("セットアップ中にエラーが発生した場合、エラーをスロー", async () => {
      const error = new Error("Setup failed");
      (TrackPlayer.getPlaybackState as jest.Mock).mockRejectedValue(error);
      (TrackPlayer.setupPlayer as jest.Mock).mockRejectedValue(error);

      await expect(setupPlayer()).rejects.toThrow(
        "プレイヤーのセットアップに失敗しました"
      );
    });

    it("getPlaybackStateでエラーが発生した場合、新規セットアップを試みる", async () => {
      (TrackPlayer.getPlaybackState as jest.Mock).mockRejectedValue(
        new Error("Not initialized")
      );
      (TrackPlayer.setupPlayer as jest.Mock).mockResolvedValue(undefined);
      (TrackPlayer.updateOptions as jest.Mock).mockResolvedValue(undefined);

      const result = await setupPlayer();

      expect(result).toBe(true);
      expect(TrackPlayer.setupPlayer).toHaveBeenCalled();
    });
  });

  describe("playbackService", () => {
    it("playbackServiceが関数を返すこと", () => {
      const service = playbackService();
      expect(typeof service).toBe("function");
    });

    it("全てのイベントリスナーが正しく登録されること", async () => {
      const service = playbackService();
      const serviceFunction = await service();

      expect(TrackPlayer.addEventListener).toHaveBeenCalledWith(
        Event.RemotePlay,
        expect.any(Function)
      );
      expect(TrackPlayer.addEventListener).toHaveBeenCalledWith(
        Event.RemotePause,
        expect.any(Function)
      );
      expect(TrackPlayer.addEventListener).toHaveBeenCalledWith(
        Event.RemoteStop,
        expect.any(Function)
      );
      expect(TrackPlayer.addEventListener).toHaveBeenCalledWith(
        Event.RemoteNext,
        expect.any(Function)
      );
      expect(TrackPlayer.addEventListener).toHaveBeenCalledWith(
        Event.RemotePrevious,
        expect.any(Function)
      );
      expect(TrackPlayer.addEventListener).toHaveBeenCalledWith(
        Event.RemoteSeek,
        expect.any(Function)
      );
      expect(TrackPlayer.addEventListener).toHaveBeenCalledWith(
        Event.PlaybackError,
        expect.any(Function)
      );
    });

    it("RemotePlayイベントで再生が開始されること", async () => {
      let playHandler: (() => void) | undefined;
      (TrackPlayer.addEventListener as jest.Mock).mockImplementation(
        (event, handler) => {
          if (event === Event.RemotePlay) {
            playHandler = handler;
          }
        }
      );

      const service = playbackService();
      await service();

      expect(playHandler).toBeDefined();
      playHandler!();
      expect(TrackPlayer.play).toHaveBeenCalled();
    });

    it("RemotePauseイベントで一時停止されること", async () => {
      let pauseHandler: (() => void) | undefined;
      (TrackPlayer.addEventListener as jest.Mock).mockImplementation(
        (event, handler) => {
          if (event === Event.RemotePause) {
            pauseHandler = handler;
          }
        }
      );

      const service = playbackService();
      await service();

      expect(pauseHandler).toBeDefined();
      pauseHandler!();
      expect(TrackPlayer.pause).toHaveBeenCalled();
    });

    it("RemoteNextイベントで次の曲にスキップされること", async () => {
      let nextHandler: (() => void) | undefined;
      (TrackPlayer.addEventListener as jest.Mock).mockImplementation(
        (event, handler) => {
          if (event === Event.RemoteNext) {
            nextHandler = handler;
          }
        }
      );

      const service = playbackService();
      await service();

      expect(nextHandler).toBeDefined();
      nextHandler!();
      expect(TrackPlayer.skipToNext).toHaveBeenCalled();
    });

    it("RemoteSeekイベントでシークされること", async () => {
      let seekHandler: ((event: { position: number }) => void) | undefined;
      (TrackPlayer.addEventListener as jest.Mock).mockImplementation(
        (event, handler) => {
          if (event === Event.RemoteSeek) {
            seekHandler = handler;
          }
        }
      );

      const service = playbackService();
      await service();

      expect(seekHandler).toBeDefined();
      seekHandler!({ position: 30 });
      expect(TrackPlayer.seekTo).toHaveBeenCalledWith(30);
    });
  });
});
