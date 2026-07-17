import TrackPlayer, { Event, PlayerCommand } from "@rntp/player";
import {
  setupPlayer,
  playbackService,
  __resetPlaybackService,
} from "@/services/PlayerService";

jest.mock("@rntp/player", () => ({
  setupPlayer: jest.fn(),
  setCommands: jest.fn(),
  getPlaybackState: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  stop: jest.fn(),
  skipToNext: jest.fn(),
  skipToPrevious: jest.fn(),
  seekTo: jest.fn(),
  addEventListener: jest.fn(),
  Event: {
    PlaybackState: "playback-state",
    PlaybackError: "playback-error",
    MediaItemTransition: "media-item-transition",
  },
  PlayerCommand: {
    Play: "play",
    Pause: "pause",
    PlayPause: "playPause",
    Next: "next",
    Previous: "previous",
    Seek: "seek",
    Stop: "stop",
  },
}));

describe("PlayerService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __resetPlaybackService();
  });

  describe("setupPlayer", () => {
    it("未セットアップの場合、新規セットアップとコマンド設定を実行する", async () => {
      const result = await setupPlayer();

      expect(result).toBe(true);
      expect(TrackPlayer.setupPlayer).toHaveBeenCalledWith({
        contentType: "music",
        handleAudioBecomingNoisy: true,
        android: {
          wakeMode: "network",
          taskRemovedBehavior: "stop",
        },
      });
      expect(TrackPlayer.setCommands).toHaveBeenCalledWith({
        capabilities: [
          PlayerCommand.PlayPause,
          PlayerCommand.Next,
          PlayerCommand.Previous,
          PlayerCommand.Seek,
          PlayerCommand.Stop,
        ],
        handling: "native",
      });
    });

    it("2回目以降の呼び出しでは再セットアップしない", async () => {
      await setupPlayer();
      (TrackPlayer.setupPlayer as jest.Mock).mockClear();
      (TrackPlayer.setCommands as jest.Mock).mockClear();

      const result = await setupPlayer();

      expect(result).toBe(true);
      expect(TrackPlayer.setupPlayer).not.toHaveBeenCalled();
      expect(TrackPlayer.setCommands).not.toHaveBeenCalled();
    });

    it("セットアップ中に例外が発生し、かつ未初期化の場合はエラーをスローする", async () => {
      (TrackPlayer.setupPlayer as jest.Mock).mockImplementation(() => {
        throw new Error("Setup failed");
      });
      (TrackPlayer.getPlaybackState as jest.Mock).mockImplementation(() => {
        throw new Error("Not initialized");
      });

      await expect(setupPlayer()).rejects.toThrow(
        "プレイヤーのセットアップに失敗しました",
      );
    });

    it("セットアップ中に例外が発生しても、既に起動済みなら成功扱いにする", async () => {
      (TrackPlayer.setupPlayer as jest.Mock).mockImplementation(() => {
        throw new Error("Already initialized");
      });
      // getPlaybackState が例外を投げない = 既に起動済み
      (TrackPlayer.getPlaybackState as jest.Mock).mockReturnValue("ready");

      const result = await setupPlayer();

      expect(result).toBe(true);
    });
  });

  describe("playbackService", () => {
    it("playbackServiceが関数を返すこと", () => {
      const service = playbackService();
      expect(typeof service).toBe("function");
    });

    it("PlaybackErrorイベントリスナーが登録されること", async () => {
      const service = playbackService();
      await service();

      expect(TrackPlayer.addEventListener).toHaveBeenCalledWith(
        Event.PlaybackError,
        expect.any(Function),
      );
    });

    it("イベントリスナーが二重登録されないこと", async () => {
      await playbackService()();
      await playbackService()();

      expect(TrackPlayer.addEventListener).toHaveBeenCalledTimes(1);
    });

    it("PlaybackErrorハンドラがエラーをログ出力すること", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      let errorHandler: ((error: unknown) => void) | undefined;
      (TrackPlayer.addEventListener as jest.Mock).mockImplementation(
        (event, handler) => {
          if (event === Event.PlaybackError) {
            errorHandler = handler;
          }
        },
      );

      await playbackService()();

      expect(errorHandler).toBeDefined();
      errorHandler!(new Error("playback error"));
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });
});
