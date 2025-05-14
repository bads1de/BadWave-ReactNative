import { useCallback, useEffect, useRef, useMemo } from "react";
import TrackPlayer, {
  State,
  usePlaybackState,
  RepeatMode,
  useActiveTrack,
  useProgress,
} from "react-native-track-player";
import Song from "@/types";
import useOnPlay from "@/hooks/useOnPlay";
import { useAudioStore, useAudioActions } from "@/hooks/useAudioStore";
import {
  usePlayerState,
  useQueueOperations,
  PlayContextType,
  PlayContext,
  logError,
  safeAsyncOperation,
} from "@/hooks/TrackPlayer";

/**
 * オーディオプレイヤーの状態管理と操作を行うカスタムフック
 * @param songs 再生可能な曲リスト
 * @param contextType 再生コンテキストタイプ
 * @param contextId コンテキストID
 * @param sectionId セクションID
 */
export function useAudioPlayer(
  songs: Song[] = [],
  contextType: PlayContextType = null,
  contextId?: string,
  sectionId?: string
) {
  const { songMap } = usePlayerState({ songs });
  const onPlay = useOnPlay();

  // Zustand ストアから状態を取得
  const {
    currentSong,
    repeatMode,
    shuffle,
    setCurrentSong,
    setRepeatMode: setStoreRepeatMode,
    setShuffle: setStoreShuffle,
  } = useAudioStore();

  // 複合アクションを取得
  const { updateCurrentSongAndState } = useAudioActions();
  const { position, duration } = useProgress();

  const isMounted = useRef(true);
  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();

  // isPlayingの値をメモ化して不要な再計算を防止
  const isPlaying = useMemo(
    () => playbackState.state === State.Playing,
    [playbackState.state]
  );

  // 進捗情報を計算（秒からミリ秒に変換）
  const progressPosition = position * 1000;
  const progressDuration = duration * 1000;

  // コンポーネントのアンマウント時の処理
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  /**
   * TrackPlayer の再生状態を設定する関数
   */
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

  const {
    updateQueueWithContext,
    toggleShuffle,
    queueState,
    getQueueState,
    updateQueueState,
  } = useQueueOperations(setTrackPlayerIsPlaying, songMap, {});

  /**
   * アクティブトラックが変更されたときの処理
   */
  useEffect(() => {
    if (!isMounted.current || !activeTrack?.id) return;

    // トラックIDに対応する曲情報を取得
    const song = songMap[activeTrack.id];

    if (!song) return;

    // 現在の曲と同じなら更新しない
    if (currentSong?.id === song.id) return;

    // 現在の曲を更新
    setCurrentSong(song);

    // キューの状態を更新
    updateQueueState((state) => ({
      lastProcessedTrackId: song.id,
      currentSongId: song.id,
    }));
  }, [
    activeTrack?.id,
    songMap,
    updateQueueState,
    setCurrentSong,
    currentSong?.id,
  ]);

  /**
   * シャッフルトグル処理用ハンドラー
   */
  const handleToggleShuffle = useCallback(async () => {
    const isShuffled = await toggleShuffle();
    setStoreShuffle(isShuffled);
    return isShuffled;
  }, [toggleShuffle, setStoreShuffle]);

  /**
   * 再生/一時停止を切り替える
   * @param song 再生する曲（オプション、指定されない場合は現在の曲に対して操作）
   * @param contextId コンテキストID（オプション）
   * @param contextType 再生コンテキストタイプ（デフォルト: "home"）
   */
  const togglePlayPause = useCallback(
    async (
      song?: Song,
      contextId?: string,
      contextType: PlayContextType = "home"
    ) => {
      // 再生可能な曲がない場合は何もしない
      if (!song && !currentSong) return;

      return safeAsyncOperation(async () => {
        // ケース1: 同じ曲の再生/一時停止切り替え
        if (song?.id === currentSong?.id || (!song && currentSong)) {
          await (isPlaying ? TrackPlayer.pause() : TrackPlayer.play());
          return true;
        }

        // ケース2: 新しい曲の再生開始
        if (song) {
          const songIndex = songs.findIndex((s) => s.id === song.id);

          if (songIndex === -1) {
            return false;
          }

          const context = { type: contextType, id: contextId };

          // キューを更新して再生開始
          await updateQueueWithContext(songs, context, songIndex);
          updateCurrentSongAndState(song);
          await onPlay(song.id);
          return true;
        }

        return false;
      }, "再生/一時停止の切り替え中にエラーが発生しました");
    },
    [
      currentSong,
      isPlaying,
      updateQueueWithContext,
      onPlay,
      songs,
      updateCurrentSongAndState,
    ]
  );

  /**
   * 指定された位置にシークする
   * @param millis シーク位置（ミリ秒）
   */
  const seekTo = useCallback(async (millis: number) => {
    return safeAsyncOperation(async () => {
      await TrackPlayer.seekTo(millis / 1000);
      return true;
    }, "シーク中にエラーが発生しました");
  }, []);

  /**
   * 次の曲を再生する
   */
  const playNextSong = useCallback(async () => {
    return safeAsyncOperation(async () => {
      await TrackPlayer.skipToNext();
      await TrackPlayer.play();
      return true;
    }, "次の曲の再生中にエラーが発生しました");
  }, []);

  /**
   * 前の曲を再生する
   */
  const playPrevSong = useCallback(async () => {
    return safeAsyncOperation(async () => {
      await TrackPlayer.skipToPrevious();
      await TrackPlayer.play();
      return true;
    }, "前の曲の再生中にエラーが発生しました");
  }, []);

  /**
   * リピートモードを設定する
   * @param mode リピートモード
   */
  const setRepeat = useCallback(
    async (mode: RepeatMode) => {
      return safeAsyncOperation(async () => {
        await TrackPlayer.setRepeatMode(mode);
        setStoreRepeatMode(mode);
        return true;
      }, "リピートモードの設定中にエラーが発生しました");
    },
    [setStoreRepeatMode]
  );

  // 返却値をメモ化して不要な再計算を防止
  const returnValues = useMemo(
    () => ({
      currentSong,
      isPlaying,
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
    }),
    [
      currentSong,
      isPlaying,
      repeatMode,
      shuffle,
      progressPosition,
      progressDuration,
      togglePlayPause,
      seekTo,
      playNextSong,
      playPrevSong,
      setRepeat,
      handleToggleShuffle,
    ]
  );

  return returnValues;
}

export { RepeatMode, State };
