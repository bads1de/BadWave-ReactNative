// hooks/TrackPlayer/queue.ts
import { MutableRefObject, useCallback, useRef } from "react";
import TrackPlayer, { Track } from "react-native-track-player";
import Song from "../../types";
import { useErrorHandler, useSafeStateUpdate } from "./utils";
import { convertToTracks } from "./track";

/**
 * @fileoverview 再生キュー管理モジュール
 * このモジュールは、TrackPlayerの再生キューを管理し、
 * 再生コンテキストに応じた曲の追加・削除・並び替えを行います。
 */

/**
 * 再生コンテキストタイプ
 * @description
 * アプリケーション内の各再生コンテキストを定義します
 *
 * @property {string} home - ホーム画面の各セクションからの再生
 * @property {string} playlist - プレイリストからの再生
 * @property {string} liked - いいね済み曲からの再生
 * @property {string} search - 検索結果からの再生
 * @property {string} genre - ジャンルページからの再生
 */
export type PlayContextType =
  | "home"
  | "playlist"
  | "liked"
  | "search"
  | "genre"
  | "forYou"
  | null;

/**
 * 再生コンテキスト情報
 * @interface PlayContext
 * @description
 * 現在の再生コンテキストを特定するための情報を保持します
 *
 * @property {PlayContextType} type - コンテキストタイプ
 * @property {string} [id] - コンテキストID（プレイリストIDなど）
 * @property {string} [sectionId] - ホーム画面のセクションID
 */
interface PlayContext {
  type: PlayContextType;
  id?: string;
  sectionId?: string;
}

/**
 * キューの状態を表す型
 */
interface QueueState {
  isShuffleEnabled: boolean;
  originalQueue: Track[];
  currentQueue: { id: string }[];
  lastProcessedTrackId: string | null;
  currentSongId: string | null;
  context: PlayContext;
}

/**
 * キュー操作フック
 * @description
 * TrackPlayerのキュー操作に関する機能を提供するカスタムフック
 *
 * @param {MutableRefObject<boolean>} isMounted - コンポーネントのマウント状態
 * @param {Function} setIsPlaying - 再生状態を設定する関数
 * @param {Record<string, Song>} songMap - 曲IDと曲情報のマップ
 * @param {Record<string, Track>} trackMap - 曲IDとトラック情報のマップ
 *
 * @returns {Object} キュー操作関数と状態
 * @property {Function} updateQueueWithContext - コンテキストに基づきキューを更新
 * @property {Function} toggleShuffle - シャッフルモードの切り替え
 * @property {MutableRefObject} queueState - キューの状態
 */
export function useQueueOperations(
  isMounted: MutableRefObject<boolean>,
  setIsPlaying: (isPlaying: boolean) => void,
  songMap: Record<string, Song>,
  trackMap: Record<string, Track>
) {
  const safeStateUpdate = useSafeStateUpdate(isMounted);
  const handleError = useErrorHandler({ safeStateUpdate, setIsPlaying });

  // キューの状態管理
  const queueContext = useRef<QueueState>({
    isShuffleEnabled: false,
    originalQueue: [],
    currentQueue: [],
    lastProcessedTrackId: null,
    currentSongId: null,
    context: {
      type: null,
    },
  });

  /**
   * キューをシャッフルする
   */
  const shuffleQueue = useCallback(async () => {
    try {
      const currentTrack = await TrackPlayer.getActiveTrack();
      if (!currentTrack) return;

      // 現在のキューを保存
      const queue = await TrackPlayer.getQueue();
      queueContext.current.originalQueue = [...queue];

      // 現在の曲を除外してシャッフル
      const remainingTracks = queue.filter(
        (track) => track.id !== currentTrack.id
      );

      // シャッフルする
      const shuffledTracks = [...remainingTracks].sort(
        () => Math.random() - 0.5
      );

      // キューをクリアして再構築
      await TrackPlayer.removeUpcomingTracks();
      await TrackPlayer.add(shuffledTracks);

      // シャッフルされたキューを保存
      const newQueue = [currentTrack, ...shuffledTracks];

      // キューの状態を更新
      queueContext.current.currentQueue = newQueue.map((track) => ({
        id: track.id as string,
      }));

      // シャッフル状態を更新
      queueContext.current.isShuffleEnabled = true;
    } catch (error) {
      handleError(error, "キューのシャッフル中にエラーが発生しました");
    }
  }, [handleError]);

  /**
   * シャッフルを解除して元のキュー順序に戻す
   */
  const unshuffleQueue = useCallback(async () => {
    try {
      const currentTrack = await TrackPlayer.getActiveTrack();

      if (!currentTrack || queueContext.current.originalQueue.length === 0)
        return;

      // 現在の曲のインデックスを取得
      const currentIndex = queueContext.current.originalQueue.findIndex(
        (track) => track.id === currentTrack.id
      );

      // 現在の曲が見つからなかった場合は何もしない
      if (currentIndex === -1) return;

      // 現在の曲より後の曲をキューに追加
      const remainingTracks = queueContext.current.originalQueue.slice(
        currentIndex + 1
      );

      // キューをクリアして再構築
      await TrackPlayer.removeUpcomingTracks();
      await TrackPlayer.add(remainingTracks);

      // シャッフルされたキューを保存
      queueContext.current.currentQueue = [
        { id: currentTrack.id as string },
        ...remainingTracks.map((track) => ({ id: track.id as string })),
      ];

      // シャッフル状態を更新
      queueContext.current.isShuffleEnabled = false;
    } catch (error) {
      handleError(error, "シャッフル解除中にエラーが発生しました");
    }
  }, [handleError]);

  /**
   * シャッフル状態を切り替える
   */
  const toggleShuffle = useCallback(async () => {
    if (queueContext.current.isShuffleEnabled) {
      await unshuffleQueue();
      return false;
    } else {
      await shuffleQueue();
      return true;
    }
  }, [shuffleQueue, unshuffleQueue]);

  /**
   * 新しいコンテキストでキューを完全に更新する
   */
  const updateQueueWithContext = useCallback(
    async (songs: Song[], context: PlayContext, startIndex: number = 0) => {
      try {
        if (songs.length === 0) return;

        // キューをクリア
        await TrackPlayer.reset();

        // トラックに変換
        const tracks = convertToTracks(songs);

        // トラックを追加
        await TrackPlayer.add(tracks);

        // 指定された曲から再生を開始するよう設定
        if (startIndex > 0 && startIndex < tracks.length) {
          await TrackPlayer.skip(startIndex);
        }

        // コンテキスト情報を更新
        queueContext.current.context = context;
        queueContext.current.originalQueue = tracks;
        queueContext.current.currentQueue = tracks.map((track) => ({
          id: track.id as string,
        }));
        queueContext.current.currentSongId = tracks[startIndex]?.id || null;
        queueContext.current.isShuffleEnabled = false;

        // 再生開始
        await TrackPlayer.play();
        setIsPlaying(true);
      } catch (error) {
        handleError(error, "キューの更新中にエラーが発生しました");
      }
    },
    [handleError, setIsPlaying]
  );

  /**
   * キューに曲を追加する
   */
  const addToQueue = useCallback(
    async (songs: Song[], insertBeforeIndex?: number) => {
      try {
        const tracks = convertToTracks(songs);

        if (insertBeforeIndex !== undefined) {
          await TrackPlayer.add(tracks, insertBeforeIndex);
        } else {
          await TrackPlayer.add(tracks);
        }

        // キューの状態を更新
        const queue = await TrackPlayer.getQueue();
        queueContext.current.currentQueue = queue.map((track) => ({
          id: track.id as string,
        }));
        queueContext.current.originalQueue = [...queue];
      } catch (error) {
        handleError(error, "キューに曲を追加中にエラーが発生しました");
      }
    },
    [handleError]
  );

  /**
   * 現在のコンテキスト情報を取得
   */
  const getCurrentContext = useCallback(() => {
    return queueContext.current.context;
  }, []);

  /**
   * キューの状態をリセットする
   */
  const resetQueue = useCallback(async () => {
    try {
      await TrackPlayer.reset();
      queueContext.current = {
        isShuffleEnabled: false,
        originalQueue: [],
        currentQueue: [],
        lastProcessedTrackId: null,
        currentSongId: null,
        context: {
          type: null,
        },
      };
    } catch (error) {
      handleError(error, "キューのリセット中にエラーが発生しました");
    }
  }, [handleError]);

  return {
    shuffleQueue,
    unshuffleQueue,
    toggleShuffle,
    addToQueue,
    updateQueueWithContext,
    getCurrentContext,
    resetQueue,
    queueState: queueContext,
  };
}
