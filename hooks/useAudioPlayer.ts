import { useEffect, useCallback, useMemo, useRef } from "react";
import TrackPlayer, {
  RepeatMode,
  State,
  Track,
  usePlaybackState,
  useProgress,
  Progress,
  Event,
} from "react-native-track-player";
import Song from "../types";
import { usePlayerStore } from "./usePlayerStore";
import { queueManager, QueueManagerError } from "../services/QueueManager";

/**
 * 曲データをトラック形式に変換 (単一の曲のみ)
 */
const convertSongToTrack = (song: Song): Track => {
  return {
    id: song.id,
    url: song.song_path,
    title: song.title,
    artist: song.author,
    artwork: song.image_path,
  };
};

/**
 * 曲データをトラック形式に変換 (複数曲)
 */
const convertToTracks = (songs: Song[]): Track[] => {
  return songs.map((song) => convertSongToTrack(song));
};

/**
 * オーディオプレイヤーのカスタムフック
 * @param songs 再生可能な曲のリスト
 */
export function useAudioPlayer(songs: Song[]) {
  // プレイヤー初期化状態の管理
  const isPlayerInitialized = useRef(false);

  // プレイヤーの初期化
  useEffect(() => {
    const initializePlayer = async () => {
      try {
        const setupNeeded = (await TrackPlayer.getState()) === null;
        if (setupNeeded && !isPlayerInitialized.current) {
          await TrackPlayer.setupPlayer();
          isPlayerInitialized.current = true;
        }
      } catch (error) {
        // 初期化エラーは無視
      }
    };

    initializePlayer();
  }, []);

  // 初期キュー設定のフラグ
  const isQueueInitialized = useRef(false);

  // コンポーネントがマウントされているかを追跡
  const isMounted = useRef(true);

  // クリーンアップ関数を保持
  const cleanupFns = useRef<(() => void)[]>([]);

  // キュー操作中フラグ
  const isQueueOperationInProgress = useRef(false);

  // 最適化: 前回のトラックIDを追跡して、重複更新を防止
  const lastProcessedTrackId = useRef<string | null>(null);

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
  const progressPosition = rawPosition * 1000;
  const progressDuration = rawDuration * 1000;

  // 曲のIDをキーとする曲データマップを作成
  const songMap = useMemo(() => {
    return songs.reduce((acc, song) => {
      acc[song.id] = song;
      return acc;
    }, {} as Record<string, Song>);
  }, [songs]);

  // キャッシュされたトラックマップ
  const trackMap = useMemo(() => {
    return songs.reduce((acc, song) => {
      acc[song.id] = convertSongToTrack(song);
      return acc;
    }, {} as Record<string, Track>);
  }, [songs]);

  /**
   * 安全な状態更新を行うためのユーティリティ関数
   */
  const safeStateUpdate = useCallback((callback: () => void) => {
    if (isMounted.current) {
      callback();
    }
  }, []);

  /**
   * エラーハンドリングを行うユーティリティ関数
   */
  const handleError = useCallback(
    (error: unknown, context: string) => {
      console.error(`${context}:`, error);
      if (error instanceof QueueManagerError) {
        console.error("キュー管理エラー:", error.message);
      } else if (error instanceof Error) {
        console.error("エラー:", error.message);
      }
      safeStateUpdate(() => setIsPlaying(false));
    },
    [safeStateUpdate, setIsPlaying]
  );

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

  // キューの初期化（プレイヤーの初期化後に実行）
  useEffect(() => {
    // 自動的なキューの初期化は行わない
    isQueueInitialized.current = true;
  }, []);

  // トラック変更のハンドリング（最適化版）
  useEffect(() => {
    const trackChangeSubscription = TrackPlayer.addEventListener(
      Event.PlaybackTrackChanged,
      async (event) => {
        if (!isMounted.current) return;

        if (event.nextTrack !== null && event.nextTrack !== undefined) {
          try {
            // 最適化: キャッシュされた索引データを使用する代わりにTrackPlayer.getTrackを回避
            const queue = await TrackPlayer.getQueue();
            const nextTrack = queue[event.nextTrack];

            if (nextTrack && nextTrack.id) {
              // 重複更新を防止
              if (lastProcessedTrackId.current === nextTrack.id) {
                return;
              }

              const song = songMap[nextTrack.id];
              if (song) {
                lastProcessedTrackId.current = nextTrack.id;
                // 最適化: requestAnimationFrameで状態更新を遅延させず、即時に更新
                safeStateUpdate(() => setCurrentSong(song));
              }
            }
          } catch (error) {
            console.error("トラック変更イベントエラー:", error);
          }
        }
      }
    );

    cleanupFns.current.push(() => {
      trackChangeSubscription.remove();
    });

    return () => {
      trackChangeSubscription.remove();
    };
  }, [songMap, setCurrentSong, safeStateUpdate]);

  // 再生状態を同期
  useEffect(() => {
    if (isMounted.current) {
      setIsPlaying(playbackState.state === State.Playing);
    }
  }, [playbackState, setIsPlaying]);

  /**
   * 指定された曲を再生する (最適化版)
   */
  const playSong = useCallback(
    async (song: Song, playlistId?: string) => {
      if (!song || isQueueOperationInProgress.current) return;

      isQueueOperationInProgress.current = true;

      try {
        // 最適化: 即座に UI 状態を更新して体感速度を改善
        safeStateUpdate(() => {
          setCurrentSong(song);
          setIsPlaying(true);
        });

        // 最適化: 最後に処理されたトラックIDを更新
        lastProcessedTrackId.current = song.id;

        // コンテキスト設定
        queueManager.setContext(playlistId ? "playlist" : "liked", playlistId);

        // 現在のキュー情報を確認
        const currentQueue = await TrackPlayer.getQueue();
        const selectedTrackIndex = currentQueue.findIndex(
          (track) => track.id === song.id
        );

        if (selectedTrackIndex !== -1) {
          // キューにすでに存在する場合は直接スキップ
          await TrackPlayer.skip(selectedTrackIndex);
          await TrackPlayer.play();
          isQueueOperationInProgress.current = false;
          return;
        }

        // キューに存在しない場合
        const track = trackMap[song.id];
        if (!track) {
          throw new Error("曲が見つかりません");
        }

        // キューをリセットして現在の曲を追加（UI応答性向上のため）
        await TrackPlayer.reset();
        await TrackPlayer.add([track]);

        // 再生開始
        const playPromise = TrackPlayer.play();

        // 非同期で残りの曲を追加（UIブロックを防止）
        setTimeout(() => {
          const remainingSongs = songs.filter((s) => s.id !== song.id);
          let remainingTracks;

          if (shuffle) {
            remainingTracks = queueManager.shuffleQueue(
              null,
              convertToTracks(remainingSongs)
            );
          } else {
            remainingTracks = convertToTracks(remainingSongs);
          }

          TrackPlayer.add(remainingTracks)
            .catch((e) => console.error("残りの曲の追加エラー:", e))
            .finally(() => {
              isQueueOperationInProgress.current = false;
            });
        }, 300);

        // 再生開始を待つ
        await playPromise;
      } catch (error) {
        handleError(error, "再生エラー");
        isQueueOperationInProgress.current = false;
      }
    },
    [
      songs,
      trackMap,
      setCurrentSong,
      setIsPlaying,
      shuffle,
      handleError,
      safeStateUpdate,
    ]
  );

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
      if (currentIndex === null || currentIndex === undefined) return;

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
