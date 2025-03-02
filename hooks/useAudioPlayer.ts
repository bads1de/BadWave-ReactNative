import { useEffect, useCallback, useRef } from "react";
import TrackPlayer, {
  RepeatMode,
  State,
  usePlaybackState,
  useProgress,
  Progress,
} from "react-native-track-player";
import type Song from "@/types";
import { usePlayerStore } from "./usePlayerStore";
import { queueManager } from "../services/QueueManager";
import { convertToTracks } from "./AudioPlayer/track";
import { usePlayerInitialization } from "./AudioPlayer/initialization";
import { usePlayerEvents } from "./AudioPlayer/events";
import { usePlayerState, calculateProgress } from "./AudioPlayer/state";
import {
  useSafeStateUpdate,
  useErrorHandler,
  useCleanup,
} from "./AudioPlayer/utils";
import { useQueueOperations } from "./AudioPlayer/queue";

/**
 * オーディオプレイヤーのカスタムフック
 * @param songs 再生可能な曲のリスト
 */
export function useAudioPlayer(songs: Song[]) {
  const { isPlayerInitialized, isQueueInitialized } = usePlayerInitialization();

  // コンポーネントがマウントされているかを追跡
  const isMounted = useRef(true);

  // クリーンアップ関数を保持
  const cleanupFns = useCleanup(isMounted);

  const {
    currentSong,
    isPlaying,
    repeatMode,
    shuffle,
    setCurrentSong,
    setIsPlaying,
    setRepeatMode,
    setShuffle,
  } = usePlayerStore();

  const playbackState = usePlaybackState();
  const { position: rawPosition, duration: rawDuration } = useProgress();
  const { progressPosition, progressDuration } = calculateProgress(
    rawPosition,
    rawDuration
  );

  // 状態管理の初期化
  const { songMap, trackMap } = usePlayerState({ songs });

  // ユーティリティ関数の初期化
  const safeStateUpdate = useSafeStateUpdate(isMounted);
  const handleError = useErrorHandler({ safeStateUpdate, setIsPlaying });

  // キュー操作の初期化
  const { playSong, isQueueOperationInProgress, lastProcessedTrackId } = useQueueOperations({
    songs,
    trackMap,
    setCurrentSong,
    setIsPlaying,
    shuffle,
    isMounted,
  });

  // コンポーネントのマウント状態を管理
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // 登録された全てのクリーンアップ関数を実行
      cleanupFns.current.forEach((cleanup) => cleanup());
      cleanupFns.current = [];
    };
  }, []);

  // イベントハンドリングの設定
  usePlayerEvents({
    isMounted,
    songMap,
    lastProcessedTrackId,
    cleanupFns,
    safeStateUpdate,
    setCurrentSong,
    setIsPlaying,
  });

  /**
   * 再生/一時停止を切り替える
   */
  const togglePlayPause = useCallback(
    async (song?: Song, playlistId?: string) => {
      if (isQueueOperationInProgress.current) return;

      try {
        if (song) {
          if (currentSong?.id === song.id) {
            // 即座に UI 状態を更新
            safeStateUpdate(() => setIsPlaying(!isPlaying));

            if (isPlaying) {
              await TrackPlayer.pause();
            } else {
              await TrackPlayer.play();
            }
          } else {
            await playSong(song, playlistId);
          }
          return;
        }

        if (currentSong) {
          // 即座に UI 状態を更新
          safeStateUpdate(() => setIsPlaying(!isPlaying));

          if (isPlaying) {
            await TrackPlayer.pause();
          } else {
            await TrackPlayer.play();
          }
        }
      } catch (error) {
        handleError(error, "再生/一時停止エラー");
      }
    },
    [
      currentSong,
      isPlaying,
      playSong,
      handleError,
      setIsPlaying,
      safeStateUpdate,
    ]
  );

  /**
   * 指定された位置にシークする
   */
  const seekTo = useCallback(
    async (millis: number) => {
      try {
        await TrackPlayer.seekTo(millis / 1000);
      } catch (error) {
        handleError(error, "シークエラー");
      }
    },
    [handleError]
  );

  /**
   * 次の曲を再生する (最適化版)
   */
  const playNextSong = useCallback(async () => {
    if (isQueueOperationInProgress.current) return;

    try {
      if (repeatMode === RepeatMode.Track) {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
        return;
      }

      const queue = await TrackPlayer.getQueue();
      if (queue.length === 0) return;

      const currentIndex = await TrackPlayer.getCurrentTrack();
      if (currentIndex === null || currentIndex === undefined) return;

      // 次の曲を先読みして、UI更新を最適化
      let nextIndex;
      if (currentIndex < queue.length - 1) {
        nextIndex = currentIndex + 1;
      } else if (
        repeatMode === RepeatMode.Queue ||
        repeatMode === RepeatMode.Off
      ) {
        nextIndex = 0;
      } else {
        return;
      }

      // 最適化: 次の曲を確認して、先行してUI更新
      if (nextIndex !== undefined && queue[nextIndex] && queue[nextIndex].id) {
        const nextSongId = queue[nextIndex].id as string;
        const nextSong = songMap[nextSongId];

        if (nextSong) {
          // 最適化: 先にUI更新を行うことで体感速度を向上
          lastProcessedTrackId.current = nextSongId;
          safeStateUpdate(() => {
            setCurrentSong(nextSong);
            setIsPlaying(true);
          });
        }
      }

      // プレイヤーの操作
      if (currentIndex < queue.length - 1) {
        await TrackPlayer.skipToNext();
      } else if (
        repeatMode === RepeatMode.Queue ||
        repeatMode === RepeatMode.Off
      ) {
        await TrackPlayer.skip(0);
      }

      await TrackPlayer.play();
    } catch (error) {
      handleError(error, "次の曲の再生エラー");
    }
  }, [
    repeatMode,
    handleError,
    songMap,
    setCurrentSong,
    setIsPlaying,
    safeStateUpdate,
  ]);

  /**
   * 前の曲を再生する (最適化版)
   */
  const playPrevSong = useCallback(async () => {
    if (isQueueOperationInProgress.current) return;

    try {
      // リピートがオンの場合は最初から再生
      if (repeatMode === RepeatMode.Track) {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
        return;
      }

      const queue = await TrackPlayer.getQueue();
      if (queue.length === 0) return;

      const currentIndex = await TrackPlayer.getActiveTrackIndex();
      if (
        currentIndex === null ||
        currentIndex === undefined ||
        currentIndex < 0
      ) {
        return;
      }

      // 前の曲を先読みして、UI更新を最適化
      let prevIndex;
      if (currentIndex > 0) {
        prevIndex = currentIndex - 1;
      } else if (
        repeatMode === RepeatMode.Queue ||
        repeatMode === RepeatMode.Off
      ) {
        prevIndex = queue.length - 1;
      } else {
        return;
      }

      // 最適化: 前の曲を確認して、先行してUI更新
      if (prevIndex !== undefined && queue[prevIndex] && queue[prevIndex].id) {
        const prevSongId = queue[prevIndex].id as string;
        const prevSong = songMap[prevSongId];

        if (prevSong) {
          // 最適化: 先にUI更新を行うことで体感速度を向上
          lastProcessedTrackId.current = prevSongId;
          safeStateUpdate(() => {
            setCurrentSong(prevSong);
            setIsPlaying(true);
          });
        }
      }

      // プレイヤーの操作
      if (currentIndex > 0) {
        await TrackPlayer.skipToPrevious();
      } else if (
        repeatMode === RepeatMode.Queue ||
        repeatMode === RepeatMode.Off
      ) {
        await TrackPlayer.skip(queue.length - 1);
      }

      await TrackPlayer.play();
    } catch (error) {
      handleError(error, "前の曲の再生エラー");
    }
  }, [
    repeatMode,
    handleError,
    songMap,
    setCurrentSong,
    setIsPlaying,
    safeStateUpdate,
  ]);

  /**
   * 再生を停止する
   */
  const stop = useCallback(async () => {
    if (isQueueOperationInProgress.current) return;

    try {
      await TrackPlayer.reset();
      safeStateUpdate(() => {
        setIsPlaying(false);
        setCurrentSong(null);
      });
    } catch (error) {
      handleError(error, "停止エラー");
    }
  }, [setIsPlaying, setCurrentSong, handleError, safeStateUpdate]);

  /**
   * シャッフルモードを設定
   */
  const handleSetShuffle = useCallback(
    async (value: boolean) => {
      if (isQueueOperationInProgress.current) return;
      isQueueOperationInProgress.current = true;

      try {
        if (value === shuffle) {
          isQueueOperationInProgress.current = false;
          return;
        }

        // まず UI 状態を更新してUIの応答性を上げる
        safeStateUpdate(() => setShuffle(value));
        queueManager.setShuffleState(value);

        // 現在再生中の曲がなければ、シャッフル状態の更新だけを行う
        if (!currentSong) {
          isQueueOperationInProgress.current = false;
          return;
        }

        // メインスレッドをブロックしないように requestAnimationFrame を使用
        requestAnimationFrame(async () => {
          try {
            const queue = await TrackPlayer.getQueue();
            if (!queue || queue.length <= 1) {
              isQueueOperationInProgress.current = false;
              return;
            }

            const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
            if (
              currentTrackIndex === null ||
              currentTrackIndex === undefined ||
              currentTrackIndex < 0
            ) {
              isQueueOperationInProgress.current = false;
              return;
            }

            const currentTrack = queue[currentTrackIndex];

            if (value) {
              // シャッフルONの処理
              queueManager.setOriginalQueue(queue);

              // 現在の曲を除外して残りをシャッフル
              const tracksAfterCurrent = queue.slice(currentTrackIndex + 1);
              if (tracksAfterCurrent.length > 0) {
                const shuffledTracks = queueManager.shuffleQueue(
                  null,
                  tracksAfterCurrent
                );

                // 現在の曲以降をクリアして、シャッフルした曲を追加
                await TrackPlayer.removeUpcomingTracks();
                await TrackPlayer.add(shuffledTracks);
              }
            } else {
              // シャッフルOFFの処理
              const originalQueue = queueManager.getOriginalQueue();
              if (originalQueue.length > 0 && currentTrack) {
                const originalIndex = originalQueue.findIndex(
                  (track) => track.id === currentTrack.id
                );

                if (originalIndex !== -1) {
                  // 元のキューから現在の曲以降を取得
                  const tracksAfterCurrent = originalQueue.slice(
                    originalIndex + 1
                  );

                  // 現在の曲以降をクリアして、元の順序の曲を追加
                  await TrackPlayer.removeUpcomingTracks();
                  await TrackPlayer.add(tracksAfterCurrent);
                }
              }
            }
          } catch (error) {
            console.error("シャッフル切替エラー:", error);
          } finally {
            isQueueOperationInProgress.current = false;
          }
        });
      } catch (error) {
        handleError(error, "シャッフルモード設定エラー");
        isQueueOperationInProgress.current = false;
      }
    },
    [shuffle, setShuffle, handleError, safeStateUpdate, currentSong]
  );

  /**
   * リピートモードを設定
   */
  const handleSetRepeat = useCallback(
    async (value: boolean) => {
      try {
        if (value) {
          const currentMode = await TrackPlayer.getRepeatMode();
          let nextMode;

          switch (currentMode) {
            case RepeatMode.Off:
              nextMode = RepeatMode.Track;
              break;
            case RepeatMode.Track:
              nextMode = RepeatMode.Queue;
              break;
            case RepeatMode.Queue:
              nextMode = RepeatMode.Off;
              break;
            default:
              nextMode = RepeatMode.Off;
          }

          // 先に状態を更新してUIの応答性を上げる
          safeStateUpdate(() => setRepeatMode(nextMode));
          await TrackPlayer.setRepeatMode(nextMode);
        } else {
          safeStateUpdate(() => setRepeatMode(RepeatMode.Off));
          await TrackPlayer.setRepeatMode(RepeatMode.Off);
        }
      } catch (error) {
        handleError(error, "リピートモード設定エラー");
      }
    },
    [setRepeatMode, handleError, safeStateUpdate]
  );

  return {
    sound: TrackPlayer,
    isPlaying,
    currentSong,
    position: progressPosition,
    duration: progressDuration,
    playSong,
    togglePlayPause,
    playNextSong,
    playPrevSong,
    stop,
    seekTo,
    repeat: repeatMode === RepeatMode.Track || repeatMode === RepeatMode.Queue,
    repeatMode: (repeatMode === RepeatMode.Track
      ? "track"
      : repeatMode === RepeatMode.Queue
      ? "queue"
      : "off") as "off" | "track" | "queue",
    setRepeat: handleSetRepeat,
    shuffle,
    setShuffle: handleSetShuffle,
  };
}

export { RepeatMode, State };
export type { Progress };
