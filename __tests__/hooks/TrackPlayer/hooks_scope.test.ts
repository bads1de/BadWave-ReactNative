import { describe, expect, it, jest } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { useQueueOperations } from "@/hooks/TrackPlayer/hooks";
import Song from "@/types";

// TrackPlayerのモック
jest.mock("react-native-track-player");

// utilsのモック
jest.mock("@/hooks/TrackPlayer/utils", () => ({
  convertToTracks: jest.fn(),
  safeAsyncOperation: jest.fn(),
  logError: jest.fn(),
  getOfflineStorageService: jest.fn(),
}));

describe("useQueueOperations Scope Synchronization", () => {
  const setIsPlaying = jest.fn();

  const mockSongs: Song[] = [
    {
      id: "song-1",
      title: "Test Song 1",
      author: "Test Artist 1",
      image_path: "https://example.com/image1.jpg",
      song_path: "https://example.com/song1.mp3",
      user_id: "test-user",
      created_at: "2023-01-01T00:00:00.000Z",
    },
  ];

  it("should synchronize state between different instances of the hook", async () => {
    // インスタンス1
    const { result: result1 } = renderHook(() =>
      useQueueOperations(setIsPlaying)
    );

    // インスタンス1で状態を更新
    act(() => {
      result1.current.updateQueueState(() => ({
        currentSongId: "song-1",
        isShuffleEnabled: true,
      }));
    });

    // ここで一旦確認
    expect(result1.current.getQueueState().currentSongId).toBe("song-1");

    // インスタンス2 (別の場所で呼ばれたフックをシミュレート)
    const { result: result2 } = renderHook(() =>
      useQueueOperations(setIsPlaying)
    );

    // インスタンス2の状態を確認
    // 【重要】現在の実装(useRef)では、インスタンス1と2は独立しているため、
    // result2では "song-1" は取得できず null になるはず。
    // これが同期される(同じ状態を参照する)ことがゴール。
    const state2 = result2.current.getQueueState();

    // このアサーションは本来「同期されてほしい」という期待を込めて書く
    // 現在の実装では失敗するはず
    expect(state2.currentSongId).toBe("song-1");
    expect(state2.isShuffleEnabled).toBe(true);
  });
});
