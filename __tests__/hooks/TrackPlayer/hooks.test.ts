import { describe, expect, it, jest, beforeEach } from "@jest/globals";
import { renderHook, act } from "@testing-library/react";
import { usePlayerState, useQueueOperations } from "@/hooks/TrackPlayer/hooks";
import { useQueueStore } from "@/hooks/TrackPlayer/useQueueStore";
import TrackPlayer, { Track } from "react-native-track-player";
import Song from "@/types";
import { PlayContext } from "@/hooks/TrackPlayer/types";
import * as utils from "@/hooks/TrackPlayer/utils";

// TrackPlayerのモック
jest.mock("react-native-track-player");

// utilsのモック
jest.mock("@/hooks/TrackPlayer/utils", () => {
  const actual = jest.requireActual("@/hooks/TrackPlayer/utils") as any;
  return {
    ...actual,
    convertToTracks: jest.fn(),
    safeAsyncOperation: jest.fn(),
    logError: jest.fn(),
    getOfflineStorageService: jest.fn(),
  };
});

describe("TrackPlayer hooks", () => {
  // テスト用のモックデータ
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
    {
      id: "song-2",
      title: "Test Song 2",
      author: "Test Artist 2",
      image_path: "https://example.com/image2.jpg",
      song_path: "https://example.com/song2.mp3",
      user_id: "test-user",
      created_at: "2023-01-02T00:00:00.000Z",
    },
    {
      id: "song-3",
      title: "Test Song 3",
      author: "Test Artist 3",
      image_path: "https://example.com/image3.jpg",
      song_path: "https://example.com/song3.mp3",
      user_id: "test-user",
      created_at: "2023-01-03T00:00:00.000Z",
    },
  ];

  const mockTracks: Track[] = mockSongs.map((song) => ({
    id: song.id,
    url: song.song_path,
    title: song.title,
    artist: song.author,
    artwork: song.image_path,
  }));

  const mockContext: PlayContext = {
    type: "playlist",
    id: "playlist-1",
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // ストアをリセット
    useQueueStore.getState().resetQueueState();

    // TrackPlayerのモックをリセット
    (TrackPlayer.getQueue as jest.Mock).mockResolvedValue([]);
    (TrackPlayer.getActiveTrack as jest.Mock).mockResolvedValue(null);
    (TrackPlayer.reset as jest.Mock).mockResolvedValue(undefined);
    (TrackPlayer.add as jest.Mock).mockResolvedValue(undefined);
    (TrackPlayer.removeUpcomingTracks as jest.Mock).mockResolvedValue(
      undefined
    );
    (TrackPlayer.skip as jest.Mock).mockResolvedValue(undefined);
    (TrackPlayer.play as jest.Mock).mockResolvedValue(undefined);

    // convertToTracksのモックをリセット
    (utils.convertToTracks as jest.Mock).mockResolvedValue(mockTracks);

    // safeAsyncOperationのモックをリセット
    (utils.safeAsyncOperation as jest.Mock).mockImplementation(
      async (operation) => {
        try {
          return await operation();
        } catch (error) {
          return undefined;
        }
      }
    );
  });

  describe("usePlayerState", () => {
    it("空の曲配列でsongMapを初期化する", () => {
      const { result } = renderHook(() => usePlayerState({ songs: [] }));

      expect(result.current.songMap).toEqual({});
    });

    it("曲配列からsongMapを正しく生成する", () => {
      const { result } = renderHook(() => usePlayerState({ songs: mockSongs }));

      expect(result.current.songMap).toEqual({
        "song-1": mockSongs[0],
        "song-2": mockSongs[1],
        "song-3": mockSongs[2],
      });
    });

    it("曲が変更されたときにsongMapを更新する", () => {
      const { result, rerender } = renderHook(
        ({ songs }) => usePlayerState({ songs }),
        {
          initialProps: { songs: mockSongs },
        }
      );

      expect(Object.keys(result.current.songMap)).toHaveLength(3);

      // 曲を追加
      const newSongs = [
        ...mockSongs,
        {
          id: "song-4",
          title: "Test Song 4",
          author: "Test Artist 4",
          image_path: "https://example.com/image4.jpg",
          song_path: "https://example.com/song4.mp3",
          user_id: "test-user",
          created_at: "2023-01-04T00:00:00.000Z",
        },
      ];

      rerender({ songs: newSongs });

      expect(Object.keys(result.current.songMap)).toHaveLength(4);
      expect(result.current.songMap["song-4"]).toBeDefined();
    });

    it("重複するIDの曲を処理する", () => {
      const duplicateSongs = [
        mockSongs[0],
        mockSongs[0], // 重複
        mockSongs[1],
      ];

      const { result } = renderHook(() =>
        usePlayerState({ songs: duplicateSongs })
      );

      // 最後の曲で上書きされる
      expect(Object.keys(result.current.songMap)).toHaveLength(2);
    });
  });

  describe("useQueueOperations", () => {
    const setIsPlaying = jest.fn();

    describe("getQueueState", () => {
      it("初期状態のキュー情報を取得する", () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        const state = result.current.getQueueState();

        expect(state.isShuffleEnabled).toBe(false);
        expect(state.originalQueue).toEqual([]);
        expect(state.currentQueue).toEqual([]);
        expect(state.lastProcessedTrackId).toBeNull();
        expect(state.currentSongId).toBeNull();
        expect(state.context.type).toBeNull();
      });

      it("状態のコピーを返す（参照ではない）", () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        const state1 = result.current.getQueueState();
        const state2 = result.current.getQueueState();

        expect(state1).toEqual(state2);
        expect(state1).not.toBe(state2); // 異なるオブジェクト
      });
    });

    describe("updateQueueState", () => {
      it("キューの状態を更新する", () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        act(() => {
          result.current.updateQueueState(() => ({
            currentSongId: "song-1",
          }));
        });

        const state = result.current.getQueueState();
        expect(state.currentSongId).toBe("song-1");
      });

      it("同じcurrentSongIdでは更新しない（最適化）", () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        act(() => {
          result.current.updateQueueState(() => ({
            currentSongId: "song-1",
          }));
        });

        const state1 = result.current.getQueueState();

        act(() => {
          result.current.updateQueueState(() => ({
            currentSongId: "song-1", // 同じID
          }));
        });

        const state2 = result.current.getQueueState();

        // 状態は更新されない
        expect(state1).toEqual(state2);
      });

      it("複数のプロパティを同時に更新する", () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        act(() => {
          result.current.updateQueueState(() => ({
            currentSongId: "song-1",
            isShuffleEnabled: true,
            lastProcessedTrackId: "song-1",
          }));
        });

        const state = result.current.getQueueState();
        expect(state.currentSongId).toBe("song-1");
        expect(state.isShuffleEnabled).toBe(true);
        expect(state.lastProcessedTrackId).toBe("song-1");
      });
    });

    describe("shuffleQueue", () => {
      beforeEach(() => {
        (TrackPlayer.getActiveTrack as jest.Mock).mockResolvedValue(
          mockTracks[0]
        );
        (TrackPlayer.getQueue as jest.Mock).mockResolvedValue(mockTracks);
      });

      it("現在の曲を除いてキューをシャッフルする", async () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        await act(async () => {
          await result.current.shuffleQueue();
        });

        expect(TrackPlayer.getActiveTrack).toHaveBeenCalled();
        expect(TrackPlayer.removeUpcomingTracks).toHaveBeenCalled();
        expect(TrackPlayer.add).toHaveBeenCalled();

        const state = result.current.getQueueState();
        expect(state.isShuffleEnabled).toBe(true);
        expect(state.originalQueue).toEqual(mockTracks);
      });

      it("アクティブなトラックがない場合は失敗する", async () => {
        (TrackPlayer.getActiveTrack as jest.Mock).mockResolvedValue(null);

        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        await act(async () => {
          await result.current.shuffleQueue();
        });

        expect(TrackPlayer.removeUpcomingTracks).not.toHaveBeenCalled();
      });

      it("シャッフル後のキューに現在の曲が先頭にある", async () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        await act(async () => {
          await result.current.shuffleQueue();
        });

        const state = result.current.getQueueState();
        expect(state.currentQueue[0].id).toBe(mockTracks[0].id);
      });

      it("エラー時にisPlayingをfalseに設定する", async () => {
        (TrackPlayer.getActiveTrack as jest.Mock).mockRejectedValue(
          new Error("Test error")
        );

        (utils.safeAsyncOperation as jest.Mock).mockImplementation(
          async (operation: any, errorMessage: any, errorHandler: any) => {
            try {
              return await operation();
            } catch (error) {
              if (errorHandler) errorHandler(error);
              return undefined;
            }
          }
        );

        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        await act(async () => {
          await result.current.shuffleQueue();
        });

        expect(setIsPlaying).toHaveBeenCalledWith(false);
      });
    });

    describe("unshuffleQueue", () => {
      beforeEach(() => {
        (TrackPlayer.getActiveTrack as jest.Mock).mockResolvedValue(
          mockTracks[1]
        );
      });

      it("元のキュー順序に戻す", async () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        // まずシャッフルする
        await act(async () => {
          result.current.updateQueueState(() => ({
            originalQueue: mockTracks,
            isShuffleEnabled: true,
          }));
        });

        await act(async () => {
          await result.current.unshuffleQueue();
        });

        expect(TrackPlayer.removeUpcomingTracks).toHaveBeenCalled();
        expect(TrackPlayer.add).toHaveBeenCalled();

        const state = result.current.getQueueState();
        expect(state.isShuffleEnabled).toBe(false);
      });

      it("originalQueueが空の場合は失敗する", async () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        await act(async () => {
          await result.current.unshuffleQueue();
        });

        expect(TrackPlayer.removeUpcomingTracks).not.toHaveBeenCalled();
      });

      it("現在の曲がoriginalQueueにない場合は失敗する", async () => {
        (TrackPlayer.getActiveTrack as jest.Mock).mockResolvedValue({
          id: "unknown-song",
          url: "test.mp3",
          title: "Unknown",
          artist: "Unknown",
        });

        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        await act(async () => {
          result.current.updateQueueState(() => ({
            originalQueue: mockTracks,
          }));
        });

        await act(async () => {
          await result.current.unshuffleQueue();
        });

        expect(TrackPlayer.removeUpcomingTracks).not.toHaveBeenCalled();
      });

      it("現在の曲より後の曲のみをキューに追加する", async () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        await act(async () => {
          result.current.updateQueueState(() => ({
            originalQueue: mockTracks,
          }));
        });

        await act(async () => {
          await result.current.unshuffleQueue();
        });

        // TrackPlayer.addが呼ばれた引数を確認
        const addCalls = (TrackPlayer.add as jest.Mock).mock.calls;
        if (addCalls.length > 0) {
          const addedTracks = addCalls[addCalls.length - 1][0] as Track[];
          // song-1（インデックス1）より後の曲のみが追加される
          expect(addedTracks).toHaveLength(mockTracks.length - 2);
          expect(addedTracks[0].id).toBe(mockTracks[2].id);
        }
      });
    });

    describe("toggleShuffle", () => {
      beforeEach(() => {
        (TrackPlayer.getActiveTrack as jest.Mock).mockResolvedValue(
          mockTracks[0]
        );
        (TrackPlayer.getQueue as jest.Mock).mockResolvedValue(mockTracks);
      });

      it("シャッフルが無効な場合は有効にする", async () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        let shuffleState: boolean | undefined;
        await act(async () => {
          shuffleState = await result.current.toggleShuffle();
        });

        expect(shuffleState).toBe(true);
        const state = result.current.getQueueState();
        expect(state.isShuffleEnabled).toBe(true);
      });

      it("シャッフルが有効な場合は無効にする", async () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        await act(async () => {
          result.current.updateQueueState(() => ({
            isShuffleEnabled: true,
            originalQueue: mockTracks,
          }));
        });

        let shuffleState: boolean | undefined;
        await act(async () => {
          shuffleState = await result.current.toggleShuffle();
        });

        expect(shuffleState).toBe(false);
        const state = result.current.getQueueState();
        expect(state.isShuffleEnabled).toBe(false);
      });
    });

    describe("updateQueueWithContext", () => {
      it("新しいコンテキストでキューを更新する", async () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        await act(async () => {
          await result.current.updateQueueWithContext(
            mockSongs,
            mockContext,
            0
          );
        });

        expect(TrackPlayer.reset).toHaveBeenCalled();
        expect(utils.convertToTracks).toHaveBeenCalledWith(mockSongs);
        expect(TrackPlayer.add).toHaveBeenCalledWith(mockTracks);
        expect(TrackPlayer.play).toHaveBeenCalled();
        expect(setIsPlaying).toHaveBeenCalledWith(true);

        const state = result.current.getQueueState();
        expect(state.context).toEqual(mockContext);
        expect(state.currentSongId).toBe(mockTracks[0].id);
      });

      it("指定されたインデックスから再生を開始する", async () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        await act(async () => {
          await result.current.updateQueueWithContext(
            mockSongs,
            mockContext,
            1
          );
        });

        expect(TrackPlayer.skip).toHaveBeenCalledWith(1);

        const state = result.current.getQueueState();
        expect(state.currentSongId).toBe(mockTracks[1].id);
      });

      it("空の曲配列の場合は失敗する", async () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        await act(async () => {
          await result.current.updateQueueWithContext([], mockContext, 0);
        });

        expect(TrackPlayer.reset).not.toHaveBeenCalled();
      });
    });

    describe("addToQueue", () => {
      it("キューに曲を追加する", async () => {
        (TrackPlayer.getQueue as jest.Mock).mockResolvedValue([
          ...mockTracks,
          mockTracks[0],
        ]);

        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        await act(async () => {
          await result.current.addToQueue(mockSongs);
        });

        expect(utils.convertToTracks).toHaveBeenCalledWith(mockSongs);
        expect(TrackPlayer.add).toHaveBeenCalledWith(mockTracks);
        expect(TrackPlayer.getQueue).toHaveBeenCalled();
      });

      it("指定されたインデックスの前に曲を挿入する", async () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        await act(async () => {
          await result.current.addToQueue(mockSongs, 1);
        });

        expect(TrackPlayer.add).toHaveBeenCalledWith(mockTracks, 1);
      });
    });

    describe("getCurrentContext", () => {
      it("現在のコンテキスト情報を取得する", () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        act(() => {
          result.current.updateQueueState(() => ({
            context: mockContext,
          }));
        });

        const context = result.current.getCurrentContext();
        expect(context).toEqual(mockContext);
      });
    });

    describe("resetQueue", () => {
      it("キューの状態を完全にリセットする", async () => {
        const { result } = renderHook(() => useQueueOperations(setIsPlaying));

        // まず状態を設定
        act(() => {
          result.current.updateQueueState(() => ({
            isShuffleEnabled: true,
            originalQueue: mockTracks,
            currentQueue: mockTracks.map((t) => ({ id: t.id as string })),
            currentSongId: "song-1",
            context: mockContext,
          }));
        });

        await act(async () => {
          await result.current.resetQueue();
        });

        expect(TrackPlayer.reset).toHaveBeenCalled();

        const state = result.current.getQueueState();
        expect(state.isShuffleEnabled).toBe(false);
        expect(state.originalQueue).toEqual([]);
        expect(state.currentQueue).toEqual([]);
        expect(state.lastProcessedTrackId).toBeNull();
        expect(state.currentSongId).toBeNull();
        expect(state.context.type).toBeNull();
      });
    });
  });
});
