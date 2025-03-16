// hooks/useAudioPlayer.ts
import { useCallback, useEffect, useRef } from "react";
import TrackPlayer, {
  State,
  usePlaybackState,
  RepeatMode,
  useActiveTrack,
  useProgress,
} from "react-native-track-player";
import Song from "../types";
import useOnPlay from "./useOnPlay";
import { useAudioStore, useAudioActions } from "./useAudioStore";
import {
  usePlayerState,
  useQueueOperations,
  useCleanup,
  PlayContextType,
  PlayContext,
} from "./TrackPlayer";

/**
 * オーディオプレイヤーの状態管理と操作を行うカスタムフック
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
  const isPlaying = playbackState.state === State.Playing;

  // 進捗情報を計算（秒からミリ秒に変換）
  const progressPosition = position * 1000;
  const progressDuration = duration * 1000;

  useCleanup(isMounted);

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
   */
  const togglePlayPause = useCallback(
    async (
      song?: Song,
      contextId?: string,
      contextType: PlayContextType = "home"
    ) => {
      try {
        // 再生可能な曲がない場合は何もしない
        if (!song && !currentSong) return;

        // 現在再生中の曲と同じ曲が指定された場合、または曲が指定されていない場合は
        // 再生/一時停止を切り替える
        if (song?.id === currentSong?.id || (!song && currentSong)) {
          await (isPlaying ? TrackPlayer.pause() : TrackPlayer.play());
          return;
        }

        // 新しい曲が指定された場合
        if (song) {
          const songIndex = songs.findIndex((s) => s.id === song.id);

          if (songIndex === -1) return;

          const context = { type: contextType, id: contextId };

          // キューを更新して再生開始
          await updateQueueWithContext(songs, context, songIndex);
          updateCurrentSongAndState(song);
          await onPlay(song.id);
        }
      } catch (error) {
        console.error("Error in togglePlayPause:", error);
      }
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
   * リピートモードを設定する
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

  return {
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
  };
}

export { RepeatMode, State };
