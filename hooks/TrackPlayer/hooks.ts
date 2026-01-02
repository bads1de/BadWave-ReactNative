import { useCallback, useMemo } from "react";
import TrackPlayer from "react-native-track-player";
import Song from "../../types";
import { PlayContext, QueueState } from "./types";
import { convertToTracks, safeAsyncOperation, shuffleArray } from "./utils";
import { useQueueStore } from "./useQueueStore";

/**
 * プレイヤーの状態管理を行うカスタムフック
 */
export function usePlayerState({ songs }: { songs: Song[] }) {
  // 曲のIDをキーとする曲データマップを作成
  return useMemo(() => {
    const songMap: Record<string, Song> = {};

    songs.forEach((song) => {
      songMap[song.id] = song;
    });

    return { songMap };
  }, [songs]);
}

/**
 * キュー操作フック
 */
export function useQueueOperations(setIsPlaying: (isPlaying: boolean) => void) {
  // キューの状態管理 (Zustandストアを使用)
  const queueState = useQueueStore();
  const { setQueueState, resetQueueState } = queueState;

  /**
   * キューの状態を安全に取得する
   */
  const getQueueState = useCallback(() => {
    // ストアの現在の状態を返す
    const {
      setQueueState: _,
      resetQueueState: __,
      ...state
    } = useQueueStore.getState();
    return state;
  }, []);

  /**
   * キューの状態を安全に更新する
   */
  const updateQueueState = useCallback(
    (updater: (state: QueueState) => Partial<QueueState>) => {
      setQueueState(updater);
    },
    [setQueueState]
  );

  /**
   * キューをシャッフルする
   */
  const shuffleQueue = useCallback(async () => {
    const handleError = () => setIsPlaying(false);

    return safeAsyncOperation(
      async () => {
        const currentTrack = await TrackPlayer.getActiveTrack();

        if (!currentTrack) {
          return false;
        }

        // 現在のキューを保存
        const queue = await TrackPlayer.getQueue();
        updateQueueState(() => ({ originalQueue: [...queue] }));

        // 現在の曲を除外してシャッフル
        const remainingTracks = queue.filter(
          (track) => track.id !== currentTrack.id
        );

        // シャッフルする
        const shuffledTracks = shuffleArray(remainingTracks);

        // キューをクリアして再構築
        await TrackPlayer.removeUpcomingTracks();
        await TrackPlayer.add(shuffledTracks);

        // シャッフルされたキューを保存
        const newQueue = [currentTrack, ...shuffledTracks];

        // キューの状態を更新
        updateQueueState(() => ({
          currentQueue: newQueue.map((track) => ({
            id: track.id as string,
          })),
          isShuffleEnabled: true,
        }));

        return true;
      },
      "キューのシャッフル中にエラーが発生しました",
      handleError
    );
  }, [setIsPlaying, updateQueueState]);

  /**
   * シャッフルを解除して元のキュー順序に戻す
   */
  const unshuffleQueue = useCallback(async () => {
    const handleError = () => setIsPlaying(false);

    return safeAsyncOperation(
      async () => {
        const currentTrack = await TrackPlayer.getActiveTrack();
        const currentQueueState = getQueueState();

        if (!currentTrack || currentQueueState.originalQueue.length === 0) {
          return false;
        }

        // 現在の曲のインデックスを取得
        const currentIndex = currentQueueState.originalQueue.findIndex(
          (track) => track.id === currentTrack.id
        );

        // 現在の曲が見つからなかった場合は何もしない
        if (currentIndex === -1) {
          return false;
        }

        // 現在の曲より後の曲をキューに追加
        const remainingTracks = currentQueueState.originalQueue.slice(
          currentIndex + 1
        );

        // キューをクリアして再構築
        await TrackPlayer.removeUpcomingTracks();
        await TrackPlayer.add(remainingTracks);

        // シャッフルされたキューを保存
        updateQueueState(() => ({
          currentQueue: [
            { id: currentTrack.id as string },
            ...remainingTracks.map((track) => ({ id: track.id as string })),
          ],
          isShuffleEnabled: false,
        }));

        return true;
      },
      "シャッフル解除中にエラーが発生しました",
      handleError
    );
  }, [getQueueState, setIsPlaying, updateQueueState]);

  /**
   * シャッフル状態を切り替える
   */
  const toggleShuffle = useCallback(async () => {
    const currentQueueState = getQueueState();

    if (currentQueueState.isShuffleEnabled) {
      const result = await unshuffleQueue();
      return result !== undefined ? false : currentQueueState.isShuffleEnabled;
    } else {
      const result = await shuffleQueue();
      return result !== undefined ? true : currentQueueState.isShuffleEnabled;
    }
  }, [getQueueState, shuffleQueue, unshuffleQueue]);

  /**
   * 新しいコンテキストでキューを完全に更新する
   */
  const updateQueueWithContext = useCallback(
    async (songs: Song[], context: PlayContext, startIndex: number = 0) => {
      const handleError = () => setIsPlaying(false);

      return safeAsyncOperation(
        async () => {
          if (songs.length === 0) {
            return false;
          }

          // キューをクリア
          await TrackPlayer.reset();

          // トラックに変換
          const tracks = await convertToTracks(songs);

          // トラックを追加
          await TrackPlayer.add(tracks);

          // 指定された曲から再生を開始するよう設定
          if (startIndex > 0 && startIndex < tracks.length) {
            await TrackPlayer.skip(startIndex);
          }

          // コンテキスト情報を更新
          updateQueueState(() => ({
            context,
            originalQueue: tracks,
            currentQueue: tracks.map((track) => ({
              id: track.id as string,
            })),
            currentSongId: tracks[startIndex]?.id || null,
            isShuffleEnabled: false,
          }));

          // 再生開始
          await TrackPlayer.play();
          setIsPlaying(true);

          return true;
        },
        "キューの更新中にエラーが発生しました",
        handleError
      );
    },
    [setIsPlaying, updateQueueState]
  );

  /**
   * キューに曲を追加する
   */
  const addToQueue = useCallback(
    async (songs: Song[], insertBeforeIndex?: number) => {
      return safeAsyncOperation(async () => {
        if (songs.length === 0) {
          return false;
        }

        const tracks = await convertToTracks(songs);

        if (insertBeforeIndex !== undefined) {
          await TrackPlayer.add(tracks, insertBeforeIndex);
        } else {
          await TrackPlayer.add(tracks);
        }

        // キューの状態を更新
        const queue = await TrackPlayer.getQueue();
        updateQueueState(() => ({
          currentQueue: queue.map((track) => ({
            id: track.id as string,
          })),
          originalQueue: [...queue],
        }));

        return true;
      }, "キューに曲を追加中にエラーが発生しました");
    },
    [updateQueueState]
  );

  /**
   * 現在のコンテキスト情報を取得
   */
  const getCurrentContext = useCallback(() => {
    return getQueueState().context;
  }, [getQueueState]);

  /**
   * キューの状態をリセットする
   */
  const resetQueue = useCallback(async () => {
    return safeAsyncOperation(async () => {
      await TrackPlayer.reset();
      resetQueueState();

      return true;
    }, "キューのリセット中にエラーが発生しました");
  }, [resetQueueState]);

  // 返却値をメモ化して不要な再計算を防止
  const returnValues = useMemo(
    () => ({
      shuffleQueue,
      unshuffleQueue,
      toggleShuffle,
      addToQueue,
      updateQueueWithContext,
      getCurrentContext,
      resetQueue,
      queueState: queueState,
      getQueueState,
      updateQueueState,
    }),
    [
      shuffleQueue,
      unshuffleQueue,
      toggleShuffle,
      addToQueue,
      updateQueueWithContext,
      getCurrentContext,
      resetQueue,
      queueState,
      getQueueState,
      updateQueueState,
    ]
  );

  return returnValues;
}
