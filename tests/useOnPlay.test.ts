import { renderHook, act } from "@testing-library/react-native";
import useOnPlay from "../hooks/useOnPlay";
import { useAudioPlayer } from "../hooks/useAudioPlayer";
import { supabase } from "@/lib/supabase";
import TrackPlayer from "react-native-track-player";

// モックのセットアップ
jest.mock("../hooks/useAudioPlayer");
jest.mock("@/lib/supabase", () => {
  const mockSingle = jest.fn().mockResolvedValue({
    data: { count: "5" },
    error: null,
  });

  const mockRpc = jest.fn().mockResolvedValue({
    data: "6",
    error: null,
  });

  const mockUpdate = jest.fn().mockReturnValue({
    eq: jest.fn().mockResolvedValue({
      data: null,
      error: null,
    }),
  });

  const mockEq = jest.fn().mockReturnValue({
    single: mockSingle,
  });

  const mockSelect = jest.fn().mockReturnValue({
    eq: mockEq,
  });

  const mockFrom = jest.fn().mockReturnValue({
    select: mockSelect,
    update: mockUpdate,
  });

  return {
    supabase: {
      from: mockFrom,
      rpc: mockRpc,
    },
  };
});

jest.mock("react-native-track-player", () => ({
  setupPlayer: jest.fn(),
  play: jest.fn(),
  pause: jest.fn(),
  seekTo: jest.fn(),
  getQueue: jest.fn(),
  getActiveTrackIndex: jest.fn(),
  RepeatMode: {
    Off: 'off',
    Track: 'track',
    Queue: 'queue'
  }
}));

const mockSongs = [
  {
    id: "1",
    user_id: "user1",
    author: "Artist 1",
    title: "Song 1",
    song_path: "path/to/song1.mp3",
    image_path: "path/to/image1.jpg",
    count: "5",
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    user_id: "user1",
    author: "Artist 2",
    title: "Song 2",
    song_path: "path/to/song2.mp3",
    image_path: "path/to/image2.jpg",
    count: "3",
    created_at: new Date().toISOString(),
  },
];

describe("useOnPlay", () => {
  let mockPlaySong: jest.Mock;

  beforeEach(() => {
    // useAudioPlayerのモック実装
    mockPlaySong = jest.fn().mockResolvedValue(null);
    (useAudioPlayer as jest.Mock).mockReturnValue({
      playSong: mockPlaySong,
      currentSong: null,
      isPlaying: false,
    });

    // console.errorのモック
    jest.spyOn(console, "error").mockImplementation(() => {});

    // タイマーのモック
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  test("新しい曲を再生した場合、再生回数が更新される", async () => {
    const { result } = renderHook(() => useOnPlay(mockSongs));

    await act(async () => {
      result.current(mockSongs[0]);
      jest.advanceTimersByTime(1000);
    });

    expect(supabase.from).toHaveBeenCalledWith("songs");
    expect(supabase.rpc).toHaveBeenCalledWith("increment", { x: "5" });
    expect(mockPlaySong).toHaveBeenCalledWith(mockSongs[0], undefined);
  });

  test("連続再生時にクールダウンが機能する", async () => {
    const { result } = renderHook(() => useOnPlay(mockSongs));

    // 最初の再生
    await act(async () => {
      result.current(mockSongs[0]);
      jest.advanceTimersByTime(1000);
    });

    // クールダウン中の再生
    await act(async () => {
      result.current(mockSongs[1]);
      jest.advanceTimersByTime(500);
    });

    // クールダウン解除後の再生
    await act(async () => {
      jest.advanceTimersByTime(1000);
      result.current(mockSongs[1]);
    });

    expect(mockPlaySong).toHaveBeenCalledTimes(2);
  });

  test("データベース更新失敗時にエラーを処理する", async () => {
    // singleメソッドのモックを上書き
    const mockSingleError = new Error("DB error");
    const mockSingleFn = jest.fn().mockResolvedValue({
      data: null,
      error: mockSingleError,
    });

    // supabase.from().select().eq().single()のチェーンを再構築
    const mockEqWithError = jest.fn().mockReturnValue({
      single: mockSingleFn,
    });

    const mockSelectWithError = jest.fn().mockReturnValue({
      eq: mockEqWithError,
    });

    (supabase.from as jest.Mock).mockReturnValueOnce({
      select: mockSelectWithError,
    });

    const { result } = renderHook(() => useOnPlay(mockSongs));

    await act(async () => {
      result.current(mockSongs[0]);
      jest.advanceTimersByTime(1000);
    });

    expect(console.error).toHaveBeenCalledWith(
      "再生回数の更新エラー:",
      expect.any(Error)
    );
  });

  test("同じ曲を連続再生した場合は回数を更新しない", async () => {
    mockPlaySong = jest.fn().mockResolvedValue(null);
    (useAudioPlayer as jest.Mock).mockReturnValue({
      playSong: mockPlaySong,
      currentSong: mockSongs[0],
      isPlaying: true,
    });

    const { result } = renderHook(() => useOnPlay(mockSongs));

    await act(async () => {
      result.current(mockSongs[0]);
      jest.advanceTimersByTime(1000);
    });

    // 同じ曲を再生した場合はfromが呼ばれないことを確認
    expect(supabase.from).not.toHaveBeenCalled();
  });

  test("曲を再生すると、react-native-track-playerのplayが呼ばれる", async () => {
    const { result } = renderHook(() => useOnPlay(mockSongs));
    const song = { id: "1", title: "Song 1", artist: "Artist 1" };
    result.current(song);
    expect(TrackPlayer.play).toHaveBeenCalled();
  });
});
