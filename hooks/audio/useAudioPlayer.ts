import { useCallback, useEffect, useRef, useMemo } from "react";
import TrackPlayer, {
  RepeatMode,
  useActiveMediaItem,
  useIsPlaying as useNativeIsPlaying,
} from "@rntp/player";
import Song from "@/types";
import useOnPlay from "@/hooks/audio/useOnPlay";
import { useAudioStore, useAudioActions } from "@/hooks/stores/useAudioStore";
import {
  usePlayerState,
  useQueueOperations,
  PlayContextType,
  safeAsyncOperation,
} from "@/hooks/audio/TrackPlayer";

interface PlaybackActionsParams {
  songs: Song[];
  contextType?: PlayContextType;
  contextId?: string;
  currentSong: Song | null;
  isPlaying: boolean;
  setTrackPlayerIsPlaying: (playing: boolean) => void;
}

function usePlaybackActions({
  songs,
  contextType = null,
  contextId,
  currentSong,
  isPlaying,
  setTrackPlayerIsPlaying,
}: PlaybackActionsParams) {
  const { updateCurrentSongAndState } = useAudioActions();
  const setStoreRepeatMode = useAudioStore((state) => state.setRepeatMode);
  const setStoreShuffle = useAudioStore((state) => state.setShuffle);
  const { updateQueueWithContext, toggleShuffle, updateQueueState } =
    useQueueOperations(setTrackPlayerIsPlaying);

  const handleToggleShuffle = useCallback(async () => {
    const isShuffled = await toggleShuffle();
    setStoreShuffle(isShuffled);
    return isShuffled;
  }, [toggleShuffle, setStoreShuffle]);

  const togglePlayPause = useCallback(
    async (
      song?: Song,
      overrideContextId?: string,
      overrideContextType?: PlayContextType,
    ) => {
      if (!song && !currentSong) return;

      const activeContextType = overrideContextType ?? contextType ?? "home";
      const activeContextId = overrideContextId ?? contextId;

      return safeAsyncOperation(async () => {
        if (song?.id === currentSong?.id || (!song && currentSong)) {
          if (isPlaying) {
            TrackPlayer.pause();
          } else {
            TrackPlayer.play();
          }
          return true;
        }

        if (song) {
          const songIndex = songs.findIndex((s) => s.id === song.id);

          if (songIndex === -1) {
            return false;
          }

          const context = { type: activeContextType, id: activeContextId };

          await updateQueueWithContext(songs, context, songIndex);
          updateCurrentSongAndState(song);
          return true;
        }

        return false;
      }, "再生/一時停止の切り替え中にエラーが発生しました");
    },
    [
      currentSong,
      isPlaying,
      updateQueueWithContext,
      songs,
      updateCurrentSongAndState,
      contextType,
      contextId,
    ],
  );

  const seekTo = useCallback(async (millis: number) => {
    return safeAsyncOperation(async () => {
      // v5 の seekTo は秒指定。ラッパーはミリ秒で受け取るため 1000 で除算
      TrackPlayer.seekTo(millis / 1000);
      return true;
    }, "シーク中にエラーが発生しました");
  }, []);

  const playNextSong = useCallback(async () => {
    return safeAsyncOperation(async () => {
      TrackPlayer.skipToNext();
      TrackPlayer.play();
      return true;
    }, "次の曲の再生中にエラーが発生しました");
  }, []);

  const playPrevSong = useCallback(async () => {
    return safeAsyncOperation(async () => {
      TrackPlayer.skipToPrevious();
      TrackPlayer.play();
      return true;
    }, "前の曲の再生中にエラーが発生しました");
  }, []);

  const setRepeat = useCallback(
    async (mode: RepeatMode) => {
      return safeAsyncOperation(async () => {
        TrackPlayer.setRepeatMode(mode);
        setStoreRepeatMode(mode);
        return true;
      }, "リピートモードの設定中にエラーが発生しました");
    },
    [setStoreRepeatMode],
  );

  return useMemo(
    () => ({
      updateQueueState,
      togglePlayPause,
      seekTo,
      playNextSong,
      playPrevSong,
      setRepeat,
      setShuffle: handleToggleShuffle,
    }),
    [
      updateQueueState,
      togglePlayPause,
      seekTo,
      playNextSong,
      playPrevSong,
      setRepeat,
      handleToggleShuffle,
    ],
  );
}

/**
 * オーディオプレイヤーの状態管理と操作を行うカスタムフックです。
 * `@rntp/player` と Zustand ストアをラップし、再生、一時停止、
 * 曲の切り替え、シーク、リピート、シャッフルなどの機能を提供します。
 *
 * @param {Song[]} songs - 再生キューの元となる曲のリスト。
 * @param {PlayContextType} [contextType=null] - 再生コンテキストの種類（例: "playlist", "album"）。
 * @param {string} [contextId] - 再生コンテキストのID（例: プレイリストID）。
 * @param {string} [sectionId] - コンテキスト内のセクションID。
 * @returns {{
 *   currentSong: Song | null | undefined,
 *   isPlaying: boolean,
 *   repeatMode: RepeatMode,
 *   shuffle: boolean,
 *   togglePlayPause: (song?: Song, contextId?: string, contextType?: PlayContextType) => Promise<boolean | undefined>,
 *   seekTo: (millis: number) => Promise<boolean | undefined>,
 *   playNextSong: () => Promise<boolean | undefined>,
 *   playPrevSong: () => Promise<boolean | undefined>,
 *   setRepeat: (mode: RepeatMode) => Promise<boolean | undefined>,
 *   setShuffle: () => Promise<boolean>
 * }} オーディオプレイヤーの状態と操作関数を含むオブジェクト。
 *   - `currentSong`: 現在再生中の曲オブジェクト。
 *   - `isPlaying`: 現在再生中かどうかを示す真偽値。
 *   - `repeatMode`: 現在のリピートモード (`Off`, `One`, `All`)。
 *   - `shuffle`: 現在シャッフルモードが有効かどうかを示す真偽値。
 *   - `togglePlayPause`: 曲の再生・一時停止を切り替えます。
 *   - `seekTo`: 指定した再生位置に移動します。
 *   - `playNextSong`: キューの次の曲を再生します。
 *   - `playPrevSong`: キューの前の曲を再生します。
 *   - `setRepeat`: リピートモードを設定します。
 *   - `setShuffle`: シャッフルモードのオン・オフを切り替えます。
 */
export function useAudioPlayer(
  songs: Song[] = [],
  contextType: PlayContextType = null,
  contextId?: string,
) {
  const { songMap } = usePlayerState({ songs });

  // Zustand ストアから状態を取得
  const currentSong = useAudioStore((state) => state.currentSong);
  const repeatMode = useAudioStore((state) => state.repeatMode);
  const shuffle = useAudioStore((state) => state.shuffle);
  const setCurrentSong = useAudioStore((state) => state.setCurrentSong);
  const onPlay = useOnPlay();

  const isMounted = useRef(true);
  const activeTrack = useActiveMediaItem();
  const initialActiveTrackIdRef = useRef<string | null>(
    activeTrack?.mediaId ?? null,
  );

  // v5 では useIsPlaying() が再生中かどうかを直接返す
  const isPlaying = useNativeIsPlaying();

  const setTrackPlayerIsPlaying = useCallback((playing: boolean) => {
    const currentlyPlaying = TrackPlayer.isPlaying();
    if (playing && !currentlyPlaying) {
      TrackPlayer.play();
    } else if (!playing && currentlyPlaying) {
      TrackPlayer.pause();
    }
  }, []);

  const { updateQueueState, ...playbackControls } = usePlaybackActions({
    songs,
    contextType,
    contextId,
    currentSong,
    isPlaying,
    setTrackPlayerIsPlaying,
  });

  // コンポーネントのアンマウント時の処理
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 前回処理したトラックIDを追跡するためのRef
  const lastProcessedTrackIdRef = useRef<string | null>(null);

  /**
   * アクティブトラックが変更されたときの処理
   *
   * 注意: lastProcessedTrackIdRefで二重実行を防いでいるため、
   * 依存配列の関数が変わっても同じトラックに対して複数回実行されることはない
   */
  useEffect(() => {
    if (!isMounted.current || !activeTrack?.mediaId) return;

    // 前回処理済みのトラックなら何もしない（無限ループ防止）
    if (lastProcessedTrackIdRef.current === activeTrack.mediaId) return;

    // トラックIDに対応する曲情報を取得
    // 優先順位1: propsとして渡されたsongs (最新の情報である可能性が高い)
    // 優先順位2: トラックに埋め込まれた元の曲情報 (バックアップ)
    let song = songMap[activeTrack.mediaId];

    if (!song && activeTrack.extras?.originalSong) {
      song = activeTrack.extras.originalSong as Song;
    }

    if (!song) return;

    const shouldSkipPlayCount =
      lastProcessedTrackIdRef.current === null &&
      initialActiveTrackIdRef.current === activeTrack.mediaId;

    // 処理済みトラックIDを記録
    lastProcessedTrackIdRef.current = activeTrack.mediaId;

    // 現在の曲を更新
    setCurrentSong(song);

    // キューの状態を更新
    updateQueueState(() => ({
      lastProcessedTrackId: song.id,
      currentSongId: song.id,
    }));

    if (!shouldSkipPlayCount) {
      void onPlay(song.id);
    }
  }, [activeTrack, songMap, setCurrentSong, updateQueueState, onPlay]);

  // 返却値をメモ化して不要な再計算を防止
  const returnValues = useMemo(
    () => ({
      currentSong,
      isPlaying,
      repeatMode,
      shuffle,
      ...playbackControls,
    }),
    [
      currentSong,
      isPlaying,
      repeatMode,
      shuffle,
      playbackControls,
    ],
  );

  return returnValues;
}

export function useIsPlaying() {
  return useNativeIsPlaying();
}

export function usePlayControls(
  songs: Song[] = [],
  contextType: PlayContextType = null,
  contextId?: string,
) {
  const currentSong = useAudioStore((state) => state.currentSong);
  const isPlaying = useNativeIsPlaying();

  const setTrackPlayerIsPlaying = useCallback((playing: boolean) => {
    const currentlyPlaying = TrackPlayer.isPlaying();
    if (playing && !currentlyPlaying) {
      TrackPlayer.play();
    } else if (!playing && currentlyPlaying) {
      TrackPlayer.pause();
    }
  }, []);

  const { updateQueueState: _updateQueueState, ...playbackControls } =
    usePlaybackActions({
      songs,
      contextType,
      contextId,
      currentSong,
      isPlaying,
      setTrackPlayerIsPlaying,
    });

  void _updateQueueState;

  return playbackControls;
}

export { RepeatMode };
