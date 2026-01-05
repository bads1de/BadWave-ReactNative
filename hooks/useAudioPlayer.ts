import { useCallback, useEffect, useRef, useMemo } from "react";
import TrackPlayer, {
  State,
  usePlaybackState,
  RepeatMode,
  useActiveTrack,
} from "react-native-track-player";
import Song from "@/types";
import useOnPlay from "@/hooks/useOnPlay";
import { useAudioStore, useAudioActions } from "@/hooks/stores/useAudioStore";
import {
  usePlayerState,
  useQueueOperations,
  PlayContextType,
  safeAsyncOperation,
} from "@/hooks/TrackPlayer";

/**
 * オーディオプレイヤーの状態管理と操作を行うカスタムフックです。
 * `react-native-track-player` と Zustand ストアをラップし、再生、一時停止、
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
 *   - `repeatMode`: 現在のリピートモード (`Off`, `Track`, `Queue`)。
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
  contextId?: string
) {
  const { songMap } = usePlayerState({ songs });
  const onPlay = useOnPlay();

  // Zustand ストアから状態を取得
  const currentSong = useAudioStore((state) => state.currentSong);
  const repeatMode = useAudioStore((state) => state.repeatMode);
  const shuffle = useAudioStore((state) => state.shuffle);
  const setCurrentSong = useAudioStore((state) => state.setCurrentSong);
  const setStoreRepeatMode = useAudioStore((state) => state.setRepeatMode);
  const setStoreShuffle = useAudioStore((state) => state.setShuffle);

  // 複合アクションを取得
  const { updateCurrentSongAndState } = useAudioActions();

  const isMounted = useRef(true);
  const activeTrack = useActiveTrack();
  const playbackState = usePlaybackState();

  // isPlayingの値をメモ化して不要な再計算を防止
  const isPlaying = useMemo(
    () => playbackState.state === State.Playing,
    [playbackState.state]
  );

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

  const { updateQueueWithContext, toggleShuffle, updateQueueState } =
    useQueueOperations(setTrackPlayerIsPlaying);

  // 前回処理したトラックIDを追跡するためのRef
  const lastProcessedTrackIdRef = useRef<string | null>(null);

  /**
   * アクティブトラックが変更されたときの処理
   *
   * 注意: lastProcessedTrackIdRefで二重実行を防いでいるため、
   * 依存配列の関数が変わっても同じトラックに対して複数回実行されることはない
   */
  useEffect(() => {
    if (!isMounted.current || !activeTrack?.id) return;

    // 前回処理済みのトラックなら何もしない（無限ループ防止）
    if (lastProcessedTrackIdRef.current === activeTrack.id) return;

    // トラックIDに対応する曲情報を取得
    // 優先順位1: propsとして渡されたsongs (最新の情報である可能性が高い)
    // 優先順位2: トラックに埋め込まれた元の曲情報 (バックアップ)
    let song = songMap[activeTrack.id];

    if (!song && activeTrack.originalSong) {
      song = activeTrack.originalSong as Song;
    }

    if (!song) return;

    // 処理済みトラックIDを記録
    lastProcessedTrackIdRef.current = activeTrack.id;

    // 現在の曲を更新
    setCurrentSong(song);

    // キューの状態を更新
    updateQueueState(() => ({
      lastProcessedTrackId: song.id,
      currentSongId: song.id,
    }));
  }, [activeTrack, songMap, setCurrentSong, updateQueueState]);

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
      overrideContextId?: string,
      overrideContextType?: PlayContextType
    ) => {
      // 再生可能な曲がない場合は何もしない
      if (!song && !currentSong) return;

      const activeContextType = overrideContextType ?? contextType ?? "home";
      const activeContextId = overrideContextId ?? contextId;

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

          const context = { type: activeContextType, id: activeContextId };

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
      contextType,
      contextId,
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
