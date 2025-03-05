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
import { useQueueOperations, PlayContextType } from "./TrackPlayer/queue";

/**
 * オーディオプレイヤーの状態管理と操作を行うカスタムフック
 *
 * このフックは以下の機能を提供します：
 * - オーディオの再生・一時停止・停止
 * - 再生位置のシーク
 * - トラックの変更とキュー管理
 *
 * @returns {Object} プレイヤーの状態と操作関数
 */
export function useAudioPlayer(
  songs: Song[] = [],
  contextType: PlayContextType = null,
  contextId?: string,
  sectionId?: string
) {
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

  // isPlayingを設定する関数
  const setIsPlaying = useCallback((playing: boolean) => {
    if (playing && playbackState.state !== State.Playing) {
      TrackPlayer.play();
    } else if (!playing && playbackState.state === State.Playing) {
      TrackPlayer.pause();
    }
  }, [playbackState.state]);

  const { updateQueueWithContext, toggleShuffle, queueState } = useQueueOperations(
    isMounted,
    setIsPlaying,
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
    const currentQueueState = queueState.current;
    currentQueueState.lastProcessedTrackId = song.id;
  }, [activeTrack, songMap, queueState]);

  // シャッフルトグル処理用ハンドラー
  const handleToggleShuffle = useCallback(async () => {
    const isShuffled = await toggleShuffle();
    setShuffle(isShuffled);
  }, [toggleShuffle]);

  /**
   * 再生/一時停止を切り替える
   *
   * @param {Song} song - 再生する曲
   * @param {string} contextId - コンテキストID（プレイリストIDなど）
   * @param {PlayContextType} contextType - コンテキストタイプ
   */
  const togglePlayPause = useCallback(
    async (song?: Song, contextId?: string, contextType: PlayContextType = "home") => {
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
          // 曲のインデックスを取得
          const songIndex = songs.findIndex(s => s.id === song.id);
          if (songIndex === -1) return;

          // コンテキスト情報を作成
          const context = {
            type: contextType,
            id: contextId,
          };

          // キューを更新して再生開始
          await updateQueueWithContext(songs, context, songIndex);
          setCurrentSong(song);
          await onPlay(song.id);
        }
      } catch (error) {
        console.error("Error in togglePlayPause:", error);
      }
    },
    [currentSong, isPlaying, updateQueueWithContext, onPlay, songs]
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
      await TrackPlayer.skipToNext();
      await TrackPlayer.play();
    } catch (error) {
      console.error("Error in playNextSong:", error);
    }
  }, []);

  /**
   * 前の曲を再生する
   */
  const playPrevSong = useCallback(async () => {
    try {
      await TrackPlayer.skipToPrevious();
      await TrackPlayer.play();
    } catch (error) {
      console.error("Error in playPrevSong:", error);
    }
  }, []);

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
  const handleSetRepeatMode = useCallback(async (mode: RepeatMode) => {
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
    setRepeat: handleSetRepeatMode,
    shuffle,
    setShuffle: handleToggleShuffle,
  };
}

export { RepeatMode, State };
