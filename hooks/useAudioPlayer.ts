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
 * 曲データをトラック形式に変換
 */
const convertToTracks = (songs: Song[]): Track[] => {
  return songs.map((song) => ({
    id: song.id,
    url: song.song_path,
    title: song.title,
    artist: song.author,
    artwork: song.image_path,
  }));
};

/**
 * オーディオプレイヤーのカスタムフック
 * @param songs 再生可能な曲のリスト
 */
export function useAudioPlayer(songs: Song[]) {
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

  // コンポーネントがマウントされているかを追跡
  const isMounted = useRef(true);

  // クリーンアップ関数を保持
  const cleanupFns = useRef<(() => void)[]>([]);

  const playbackState = usePlaybackState();
  const { position: rawPosition, duration: rawDuration } = useProgress();
  const progressPosition = rawPosition * 1000;
  const progressDuration = rawDuration * 1000;

  // 曲のIDをキーとするインデックスマップを作成
  const songIndexMap = useMemo(() => {
    return songs.reduce((acc, song, index) => {
      acc[song.id] = index;
      return acc;
    }, {} as Record<string, number>);
  }, [songs]);

  // 曲のIDをキーとする曲データマップを作成
  const songMap = useMemo(() => {
    return songs.reduce((acc, song) => {
      acc[song.id] = song;
      return acc;
    }, {} as Record<string, Song>);
  }, [songs]);

  // トラック変更のハンドリング
  useEffect(() => {
    if (!isMounted.current) return;

    const trackChangeSubscription = TrackPlayer.addEventListener(
      Event.PlaybackTrackChanged,
      async (event) => {
        if (event.nextTrack !== null && event.nextTrack !== undefined) {
          const track = await TrackPlayer.getTrack(event.nextTrack);
          if (track && track.id) {
            const song = songMap[track.id];
            if (song) {
              safeStateUpdate(() => setCurrentSong(song));
            }
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
  }, [songMap, setCurrentSong]);

  // コンポーネントのマウント状態を管理
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      // 登録された全てのクリーンアップ関数を実行
      cleanupFns.current.forEach(cleanup => cleanup());
      cleanupFns.current = [];
    };
  }, []);

  // 再生状態を同期
  useEffect(() => {
    if (isMounted.current) {
      setIsPlaying(playbackState.state === State.Playing);
    }
  }, [playbackState, setIsPlaying]);

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
  const handleError = useCallback((error: unknown, context: string) => {
    console.error(`${context}:`, error);
    if (error instanceof QueueManagerError) {
      console.error("キュー管理エラー:", error.message);
    } else if (error instanceof Error) {
      console.error("エラー:", error.message);
    }
    safeStateUpdate(() => setIsPlaying(false));
  }, [safeStateUpdate, setIsPlaying]);

  /**
   * 指定された曲を再生する
   */
  const playSong = useCallback(
    async (song: Song, playlistId?: string) => {
      if (!song) return;

      try {
        safeStateUpdate(() => setCurrentSong(song));
        
        // プレイリストIDがあればプレイリストコンテキスト、なければいいね曲コンテキストを設定
        if (playlistId) {
          queueManager.setContext('playlist', playlistId);
        } else {
          queueManager.setContext('liked');
        }
        
        const tracks = convertToTracks(songs);
        const selectedTrack = tracks.find(track => track.id === song.id);
        
        if (!selectedTrack) {
          throw new Error("曲が見つかりません");
        }

        // 現在のキュー情報を確認
        const currentQueue = await TrackPlayer.getQueue();
        const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
        const currentContext = queueManager.getContext();
        const newContext = playlistId
          ? { type: 'playlist' as const, id: playlistId }
          : { type: 'liked' as const };

        // コンテキストが変更された場合は、キューを再構築
        const contextChanged =
          currentContext.type !== newContext.type ||
          currentContext.id !== newContext.id;

        const isCurrentlyPlaying = currentTrackIndex !== null &&
                                 currentTrackIndex !== undefined &&
                                 currentTrackIndex >= 0;

        // コンテキストが同じで、選択した曲が現在のキューに存在する場合
        const selectedTrackInQueue = !contextChanged && isCurrentlyPlaying ?
          currentQueue.findIndex(track => track.id === selectedTrack.id) : -1;

        if (selectedTrackInQueue !== -1) {
          // 選択した曲がすでにキューにある場合は、その曲にスキップ
          await TrackPlayer.skip(selectedTrackInQueue);
          await TrackPlayer.play();
          return;
        }

        // キューのクリアと再設定
        await TrackPlayer.reset();

        if (queueManager.getShuffleState()) {
          // シャッフルモードの場合、選択した曲を先頭に、残りをシャッフル
          const shuffledQueue = queueManager.shuffleQueue(selectedTrack, tracks);
          queueManager.setOriginalQueue(tracks);
          await TrackPlayer.add(shuffledQueue);
        } else {
          // 通常モードの場合は順番通りに追加
          await TrackPlayer.add(tracks);
          await TrackPlayer.skip(songIndexMap[song.id]);
        }

        await TrackPlayer.play();
      } catch (error) {
        handleError(error, "再生エラー");
      }
    },
    [songs, songIndexMap, setCurrentSong, handleError]
  );

  /**
   * 再生/一時停止を切り替える
   */
  const togglePlayPause = useCallback(
    async (song?: Song, playlistId?: string) => {
      try {
        if (song) {
          if (currentSong?.id === song.id) {
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
    [currentSong, isPlaying, playSong, handleError]
  );

  /**
   * 指定された位置にシークする
   */
  const seekTo = useCallback(async (millis: number) => {
    try {
      await TrackPlayer.seekTo(millis / 1000);
    } catch (error) {
      handleError(error, "シークエラー");
    }
  }, [handleError]);

  /**
   * 次の曲を再生する
   */
  const playNextSong = useCallback(async () => {
    try {
      const queue = await TrackPlayer.getQueue();
      const currentIndex = await TrackPlayer.getCurrentTrack();

      if (repeatMode === RepeatMode.Track) {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
        return;
      }

      if (currentIndex != null && currentIndex < queue.length - 1) {
        await TrackPlayer.skipToNext();
        await TrackPlayer.play();
      } else if (queue.length > 0) {
        if (repeatMode === RepeatMode.Queue || repeatMode === RepeatMode.Off) {
          await TrackPlayer.skip(0);
          await TrackPlayer.play();
        }
      }
    } catch (error) {
      handleError(error, "次の曲の再生エラー");
    }
  }, [repeatMode, handleError]);

  /**
   * 前の曲を再生する
   */
  const playPrevSong = useCallback(async () => {
    try {
      const queue = await TrackPlayer.getQueue();
      const currentIndex = await TrackPlayer.getActiveTrackIndex();
      const position = await TrackPlayer.getProgress().then(
        (progress) => progress.position
      );

      if (position > 3) {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
        return;
      }

      if (repeatMode === RepeatMode.Track) {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
        return;
      }

      if (currentIndex != null && currentIndex > 0) {
        await TrackPlayer.skipToPrevious();
        await TrackPlayer.play();
      } else if (queue.length > 0) {
        if (repeatMode === RepeatMode.Queue || repeatMode === RepeatMode.Off) {
          await TrackPlayer.skip(queue.length - 1);
          await TrackPlayer.play();
        }
      }
    } catch (error) {
      handleError(error, "前の曲の再生エラー");
    }
  }, [repeatMode, handleError]);

  /**
   * 再生を停止する
   */
  const stop = useCallback(async () => {
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
  const handleSetShuffle = useCallback(async (value: boolean) => {
    try {
      if (value !== shuffle) {
        const queue = await TrackPlayer.getQueue();
        if (!queue || queue.length <= 1) return;

        const currentTrackIndex = await TrackPlayer.getActiveTrackIndex();
        const currentTrack = currentTrackIndex !== null && 
                           currentTrackIndex !== undefined && 
                           currentTrackIndex >= 0
          ? queue[currentTrackIndex]
          : null;

        queueManager.setShuffleState(value);

        if (value) {
          queueManager.setOriginalQueue(queue);
          const shuffledQueue = queueManager.shuffleQueue(currentTrack, queue);
          await TrackPlayer.removeUpcomingTracks();
          if (currentTrack) {
            await TrackPlayer.add(shuffledQueue.slice(1));
          } else {
            await TrackPlayer.add(shuffledQueue);
          }
        } else {
          const originalQueue = queueManager.getOriginalQueue();
          if (currentTrack && originalQueue.length > 0) {
            const originalIndex = originalQueue.findIndex(track => track.id === currentTrack.id);
            if (originalIndex !== -1) {
              const tracksAfterCurrent = originalQueue.slice(originalIndex + 1);
              await TrackPlayer.removeUpcomingTracks();
              await TrackPlayer.add(tracksAfterCurrent);
            }
          }
        }

        safeStateUpdate(() => setShuffle(value));
      }
    } catch (error) {
      handleError(error, "シャッフルモード設定エラー");
    }
  }, [shuffle, setShuffle, handleError, safeStateUpdate]);

  /**
   * リピートモードを設定
   */
  const handleSetRepeat = useCallback(async (value: boolean) => {
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
        await TrackPlayer.setRepeatMode(nextMode);
        safeStateUpdate(() => setRepeatMode(nextMode));
      } else {
        await TrackPlayer.setRepeatMode(RepeatMode.Off);
        safeStateUpdate(() => setRepeatMode(RepeatMode.Off));
      }
    } catch (error) {
      handleError(error, "リピートモード設定エラー");
    }
  }, [setRepeatMode, handleError, safeStateUpdate]);

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
    repeatMode: (repeatMode === RepeatMode.Track ? 'track' : 
                repeatMode === RepeatMode.Queue ? 'queue' : 
                'off') as 'off' | 'track' | 'queue',
    setRepeat: handleSetRepeat,
    shuffle,
    setShuffle: handleSetShuffle,
  };
}

export { RepeatMode, State };
export type { Progress };