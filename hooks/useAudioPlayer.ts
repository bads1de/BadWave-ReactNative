import { useCallback, useEffect, useRef } from "react";
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
import { useAudioStore, useAudioActions } from "./useAudioStore";

/**
 * @fileoverview オーディオプレーヤーのカスタムフック
 * このモジュールは、アプリケーションの音楽再生機能のフロントエンド部分を管理します。
 */

/**
 * オーディオプレーヤーの状態管理と操作を行うカスタムフック
 * @description
 * このフックは以下の機能を提供します：
 * - 再生制御（再生、一時停止、停止）
 * - トラック操作（次へ、前へ、シーク）
 * - キュー管理（追加、削除、並べ替え）
 * - 再生状態の監視
 * - プレイリスト管理
 *
 * @param {Song[]} songs - 再生対象の曲リスト
 * @param {PlayContextType} contextType - 再生コンテキストの種類（ホーム、プレイリスト等）
 * @param {string} [contextId] - コンテキストの一意識別子
 * @param {string} [sectionId] - セクションの一意識別子
 *
 * @returns {Object} プレーヤーの状態と操作関数
 * @property {boolean} isPlaying - 現在の再生状態
 * @property {Song | null} currentSong - 現在再生中の曲
 * @property {number} position - 現在の再生位置（秒）
 * @property {number} duration - 曲の総再生時間（秒）
 * @property {Function} togglePlayPause - 再生/一時停止を切り替える関数
 * @property {Function} seekTo - 指定位置にシークする関数
 * @property {Function} playNext - 次の曲を再生する関数
 * @property {Function} playPrevious - 前の曲を再生する関数
 *
 * @example
 * ```typescript
 * const {
 *   isPlaying,
 *   currentSong,
 *   togglePlayPause,
 *   seekTo
 * } = useAudioPlayer(songs, "playlist", "playlist-123");
 *
 * // 再生/一時停止
 * const handlePlayPause = () => {
 *   togglePlayPause();
 * };
 *
 * // 特定位置にシーク
 * const handleSeek = (position: number) => {
 *   seekTo(position);
 * };
 * ```
 */
export function useAudioPlayer(
  songs: Song[] = [],
  contextType: PlayContextType = null,
  contextId?: string,
  sectionId?: string
) {
  const { songMap, trackMap } = usePlayerState({ songs });
  const onPlay = useOnPlay();

  // Zustand ストアから状態を取得
  const {
    currentSong,
    isPlaying: storeIsPlaying,
    repeatMode,
    shuffle,
    setCurrentSong,
    setIsPlaying,
    setRepeatMode: setStoreRepeatMode,
    setShuffle: setStoreShuffle,
  } = useAudioStore();

  // 複合アクションを取得
  const { updateCurrentSongAndState } = useAudioActions();

  const isMounted = useRef(true);
  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();

  // TrackPlayer から直接進捗情報を取得
  const { position, duration } = useProgress();

  useCleanup(isMounted);

  // playbackState から実際の再生状態を取得し、ストアと同期
  useEffect(() => {
    const actualIsPlaying = playbackState.state === State.Playing;
    if (actualIsPlaying !== storeIsPlaying) {
      setIsPlaying(actualIsPlaying);
    }
  }, [playbackState.state, storeIsPlaying, setIsPlaying]);

  // TrackPlayer の再生状態を設定する関数
  const setTrackPlayerIsPlaying = useCallback(
    (playing: boolean) => {
      if (playing && playbackState.state !== State.Playing) {
        TrackPlayer.play();
      } else if (!playing && playbackState.state === State.Playing) {
        TrackPlayer.pause();
      }
    },
    [playbackState.state]
  );

  const { updateQueueWithContext, toggleShuffle, queueState } =
    useQueueOperations(isMounted, setTrackPlayerIsPlaying, songMap, trackMap);

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
  }, [activeTrack, songMap, queueState, setCurrentSong]);

  // シャッフルトグル処理用ハンドラー
  const handleToggleShuffle = useCallback(async () => {
    const isShuffled = await toggleShuffle();
    setStoreShuffle(isShuffled);
    return isShuffled;
  }, [toggleShuffle, setStoreShuffle]);

  /**
   * 再生/一時停止を切り替える
   *
   * @param {Song} song - 再生する曲
   * @param {string} contextId - コンテキストID（プレイリストIDなど）
   * @param {PlayContextType} contextType - コンテキストタイプ
   */
  const togglePlayPause = useCallback(
    async (
      song?: Song,
      contextId?: string,
      contextType: PlayContextType = "home"
    ) => {
      try {
        if (!song && !currentSong) return;

        const isSameSong = song && currentSong?.id === song.id;
        const shouldToggleCurrentSong = isSameSong || (!song && currentSong);

        // 再生状態を更新
        if (shouldToggleCurrentSong) {
          const newIsPlaying = !storeIsPlaying;
          await (storeIsPlaying ? TrackPlayer.pause() : TrackPlayer.play());
          setIsPlaying(newIsPlaying);
          return;
        }

        // songが指定されている場合はキューを更新
        if (song) {
          // 曲のインデックスを取得
          const songIndex = songs.findIndex((s) => s.id === song.id);
          if (songIndex === -1) return;

          // コンテキスト情報を作成
          const context = {
            type: contextType,
            id: contextId,
          };

          // キューを更新して再生開始
          await updateQueueWithContext(songs, context, songIndex);
          updateCurrentSongAndState(song, true);
          await onPlay(song.id);
        }
      } catch (error) {
        console.error("Error in togglePlayPause:", error);
      }
    },
    [
      currentSong,
      storeIsPlaying,
      updateQueueWithContext,
      onPlay,
      songs,
      setIsPlaying,
      updateCurrentSongAndState,
    ]
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
      setIsPlaying(true);
    } catch (error) {
      console.error("Error in playNextSong:", error);
    }
  }, [setIsPlaying]);

  /**
   * 前の曲を再生する
   */
  const playPrevSong = useCallback(async () => {
    try {
      await TrackPlayer.skipToPrevious();
      await TrackPlayer.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error in playPrevSong:", error);
    }
  }, [setIsPlaying]);

  /**
   * リピートモードを設定する
   * @param {RepeatMode} mode - 設定するリピートモード
   */
  const setRepeat = useCallback(
    async (mode: RepeatMode) => {
      try {
        await TrackPlayer.setRepeatMode(mode);
        setStoreRepeatMode(mode);
      } catch (error) {
        console.error("Error setting repeat mode:", error);
      }
    },
    [setStoreRepeatMode]
  );

  // 進捗情報を計算
  const progressPosition = position * 1000;
  const progressDuration = duration * 1000;

  return {
    // Zustand ストアから取得した状態
    currentSong,
    isPlaying: storeIsPlaying,
    repeatMode,
    shuffle,
    progressPosition,
    progressDuration,
    togglePlayPause,
    seekTo,
    playNextSong,
    playPrevSong,
    setRepeat,
    setShuffle: handleToggleShuffle,
  };
}

export { RepeatMode, State };
