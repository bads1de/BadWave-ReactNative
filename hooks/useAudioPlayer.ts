import { useCallback, useEffect, useRef, useState } from "react";
import TrackPlayer, {
  State,
  usePlaybackState,
  useProgress,
  RepeatMode,
  useActiveTrack,
} from "react-native-track-player";
import { useCleanup } from "./TrackPlayer/utils";
import Song from "../types";
import useOnPlay from "./useOnPlay";
import { usePlayerState } from "./TrackPlayer/state";
import { useQueueOperations } from "./TrackPlayer/queue";

/**
 * オーディオプレイヤーの状態管理と操作を行うカスタムフック
 *
 * このフックは以下の機能を提供します：
 * - オーディオの再生・一時停止・停止
 * - 再生位置のシーク
 * - 音量と再生速度の制御
 * - トラックの変更とキュー管理
 *
 * @returns {Object} プレイヤーの状態と操作関数
 * @property {boolean} isPlaying - 再生中かどうか
 * @property {number} progressPosition - 現在の再生位置（秒）
 * @property {number} progressDuration - トラックの総再生時間（秒）
 * @property {Function} togglePlayPause - 再生/一時停止を切り替える
 * @property {Function} seekTo - 指定した位置にシークする
 * @property {Function} playNextSong - 次の曲を再生する
 * @property {Function} playPrevSong - 前の曲を再生する
 * @property {Function} stop - 再生を停止する
 * @property {RepeatMode} repeatMode - リピートモード
 * @property {Function} setRepeatMode - リピートモードを設定する
 * @property {boolean} shuffle - シャッフルモード
 * @property {Function} setShuffle - シャッフルモードを設定する
 */
export function useAudioPlayer(songs: Song[]) {
  const { songMap, trackMap } = usePlayerState({ songs });
  const onPlay = useOnPlay();
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(RepeatMode.Off);
  const [shuffle, setShuffle] = useState<boolean>(false);

  const isMounted = useRef(true);
  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();
  const { position, duration } = useProgress();

  useCleanup(isMounted);

  const isPlaying = playbackState.state === State.Playing;
  const progressPosition = position * 1000;
  const progressDuration = duration * 1000;

  const { playNewQueue, setShuffleMode, getQueueState } = useQueueOperations(
    isMounted,
    isPlaying,
    songMap,
    trackMap
  );

  // アクティブトラックが変更されたときの処理
  useEffect(() => {
    // コンポーネントがアンマウントされている場合は処理を中止
    if (!isMounted.current || !activeTrack?.id) return;

    // トラックIDに対応する曲情報を取得
    const song = songMap[activeTrack.id];
    if (!song) return;

    // 現在の曲を更新
    setCurrentSong(song);

    // キューの状態を更新
    const queueState = getQueueState();
    queueState.lastProcessedTrackId = song.id;
  }, [activeTrack, songMap, getQueueState]);

  // シャッフルモードの変更を監視
  useEffect(() => {
    setShuffleMode(shuffle);
  }, [shuffle, setShuffleMode]);

  /**
   * 再生/一時停止を切り替える
   * @param {Song} song - 再生する曲
   * @param {string} playlistId - プレイリストID
   */
  const togglePlayPause = useCallback(
    async (song?: Song, playlistId?: string) => {
      try {
        if (!song && !currentSong) return;

        const isSameSong = song && currentSong?.id === song.id;
        const shouldToggleCurrentSong = isSameSong || (!song && currentSong);

        // 再生状態を更新
        if (shouldToggleCurrentSong) {
          await (isPlaying ? TrackPlayer.pause() : TrackPlayer.play());
          return;
        }

        // songが指定されている場合はキューを更新
        if (song) {
          // キューを更新
          const success = await playNewQueue(song, songs, playlistId);

          // キュー更新が成功した場合は再生
          if (success) {
            setCurrentSong(song);
            await onPlay(song.id);
            await TrackPlayer.play();
          }
        }
      } catch (error) {
        console.error("Error in togglePlayPause:", error);
      }
    },
    [currentSong, isPlaying, playNewQueue, onPlay, songs]
  );

  /**
   * 指定された位置にシークする
   * @param {number} millis - シークする位置（ミリ秒）
   */
  const seekTo = useCallback(async (millis: number) => {
    try {
      await TrackPlayer.seekTo(millis / 1000);
    } catch (error) {
      console.error("Error seeking to position:", error);
    }
  }, []);

  /**
   * 次の曲を再生する
   */
  const playNextSong = useCallback(async () => {
    try {
      const queue = await TrackPlayer.getQueue();
      const currentIndex = await TrackPlayer.getActiveTrackIndex();

      if (currentIndex === null) {
        return;
      }

      // リピートモードがトラックの場合
      if (repeatMode === RepeatMode.Track) {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
        return;
      }

      // 最後の曲の場合
      if (currentIndex === queue.length - 1) {
        // リピートモードがキューの場合
        if (repeatMode === RepeatMode.Queue) {
          await TrackPlayer.skip(0);
          await TrackPlayer.play();
        } else {
          // リピートモードがオフの場合
          await TrackPlayer.seekTo(0);
          await TrackPlayer.pause();
        }
      } else {
        // 次の曲を再生
        await TrackPlayer.skipToNext();
        await TrackPlayer.play();
      }
    } catch (error) {
      console.error("Error in playNextSong:", error);
    }
  }, [repeatMode]);

  /**
   * 前の曲を再生する
   */
  const playPrevSong = useCallback(async () => {
    try {
      const currentIndex = await TrackPlayer.getActiveTrackIndex();
      const queue = await TrackPlayer.getQueue();

      if (currentIndex === null) {
        return;
      }

      // リピートモードがトラックの場合
      if (repeatMode === RepeatMode.Track) {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
        return;
      }

      // 最初の曲の場合
      if (currentIndex === 0) {
        // リピートモードがキューの場合
        if (repeatMode === RepeatMode.Queue) {
          await TrackPlayer.skip(queue.length - 1);
          await TrackPlayer.play();
        } else {
          // リピートモードがオフの場合
          await TrackPlayer.seekTo(0);
          await TrackPlayer.play();
        }
      } else {
        // 前の曲を再生
        await TrackPlayer.skipToPrevious();
        await TrackPlayer.play();
      }
    } catch (error) {
      console.error("Error in playPrevSong:", error);
    }
  }, [repeatMode]);

  /**
   * 再生を停止する
   */
  const stop = useCallback(async () => {
    try {
      await TrackPlayer.reset();
      setCurrentSong(null);
    } catch (error) {
      console.error("Error stopping playback:", error);
    }
  }, []);

  /**
   * リピートモードを設定する
   * @param {RepeatMode} mode - リピートモード
   */
  const handleSetRepeat = useCallback(async (mode: RepeatMode) => {
    try {
      await TrackPlayer.setRepeatMode(mode);
      setRepeatMode(mode);
    } catch (error) {
      console.error("Error setting repeat mode:", error);
    }
  }, []);

  return {
    currentSong,
    isPlaying,
    progressPosition,
    progressDuration,
    togglePlayPause,
    seekTo,
    playNextSong,
    playPrevSong,
    stop,
    repeatMode,
    setRepeat: handleSetRepeat,
    shuffle,
    setShuffle,
  };
}

export { RepeatMode, State };
