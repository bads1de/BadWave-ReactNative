import { useCallback, MutableRefObject, useRef } from "react";
import TrackPlayer, { Track } from "react-native-track-player";
import type Song from "@/types";
import { convertToTracks } from "./track";
import { useSafeStateUpdate, useErrorHandler } from "./utils";

/**
 * キューの状態を表す型
 */
interface QueueState {
  isShuffleEnabled: boolean;
  originalQueue: Track[];
  currentQueue: { id: string }[];
  lastProcessedTrackId: string | null;
  playlistId: string | null;
  currentSongId: string | null;
  context: {
    type: "playlist" | "liked" | null;
    id: string | undefined;
  };
}

/**
 * キュー管理に関するエラー
 */
export class QueueManagerError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QueueManagerError";
  }
}

/**
 * キュー操作に関するフック
 * 
 * @param isMounted - コンポーネントのマウント状態を管理するRef
 * @param setIsPlaying - 再生状態を更新する関数
 * @param songMap - 曲IDをキーとした曲データのマップ
 * @param trackMap - トラックIDをキーとしたトラックデータのマップ
 * @returns キュー操作に関する関数群
 */
export function useQueueOperations(
  isMounted: MutableRefObject<boolean>,
  setIsPlaying: (isPlaying: boolean) => void,
  songMap: Record<string, Song>,
  trackMap: Record<string, Track>
) {
  const safeStateUpdate = useSafeStateUpdate(isMounted);
  const handleError = useErrorHandler({ safeStateUpdate, setIsPlaying });
  const queueContext = useRef<QueueState>({
    isShuffleEnabled: false,
    originalQueue: [],
    currentQueue: [],
    lastProcessedTrackId: null,
    playlistId: null,
    currentSongId: null,
    context: {
      type: null,
      id: undefined,
    },
  });

  /**
   * キューをシャッフルする
   * 
   * @remarks
   * - 現在再生中のトラックはそのまま保持
   * - 残りのトラックをランダムに並べ替え
   * - シャッフル後のキューを保存
   * @throws {QueueManagerError} シャッフル処理中にエラーが発生した場合
   */
  const shuffleQueue = useCallback(async () => {
    try {
      const currentTrack = await TrackPlayer.getActiveTrack();
      if (!currentTrack) return;

      // 現在のキューを保存
      const queue = await TrackPlayer.getQueue();
      queueContext.current.originalQueue = [...queue];

      // 現在の曲を除外してシャッフル
      const remainingTracks = queue.filter((track) => track.id !== currentTrack.id);
      const shuffledTracks = [...remainingTracks].sort(() => Math.random() - 0.5);

      // キューをクリアして再構築
      await TrackPlayer.removeUpcomingTracks();
      await TrackPlayer.add(shuffledTracks);

      // シャッフルされたキューを保存
      const newQueue = [currentTrack, ...shuffledTracks];
      queueContext.current.currentQueue = newQueue.map((track) => ({
        id: track.id as string,
      }));
    } catch (error) {
      handleError(error, "キューのシャッフル中にエラーが発生しました");
    }
  }, [handleError]);

  /**
   * キューに曲を追加する
   * 
   * @param songs - 追加する曲の配列
   * @param insertBeforeIndex - 指定した位置に挿入する場合のインデックス
   * @remarks
   * - 指定位置がない場合は末尾に追加
   * - キューの状態を更新
   * - 現在の曲のメタデータを更新
   * @throws {QueueManagerError} キュー追加処理中にエラーが発生した場合
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

        // 現在の曲のメタデータを更新
        const currentTrack = await TrackPlayer.getActiveTrack();
        if (currentTrack) {
          await TrackPlayer.updateNowPlayingMetadata(currentTrack);
        }
      } catch (error) {
        handleError(error, "キューへの追加中にエラーが発生しました");
      }
    },
    [handleError]
  );

  /**
   * 新しいキューを再生する
   * 
   * @param song - 再生を開始する曲
   * @param songs - キューに含める曲の配列
   * @param playlistId - プレイリストID（任意）
   * @returns キューの作成に成功した場合はtrue、失敗した場合はfalse
   * @remarks
   * - 既存のキューをリセット
   * - 指定された曲から始まるように曲順を再編成
   * - キューの状態を初期化
   * @throws {QueueManagerError} キュー作成処理中にエラーが発生した場合
   */
  const playNewQueue = useCallback(
    async (song: Song, songs: Song[], playlistId?: string) => {
      try {
        // 現在のキューをクリア
        await TrackPlayer.reset();

        // 選択された曲のインデックスを見つける
        const songIndex = songs.findIndex((s) => s.id === song.id);
        if (songIndex === -1) return false;

        // キューの状態を更新
        queueContext.current = {
          playlistId: playlistId || null,
          currentSongId: song.id,
          isShuffleEnabled: false,
          lastProcessedTrackId: song.id,
          originalQueue: [],
          currentQueue: [],
          context: {
            type: playlistId ? "playlist" : "liked",
            id: playlistId || undefined,
          },
        };

        // 選択された曲から始まる新しい配列を作成
        const reorderedSongs = [
          ...songs.slice(songIndex),
          ...songs.slice(0, songIndex),
        ];

        // トラックをキューに追加
        const tracks = reorderedSongs.map((song) => ({
          id: song.id,
          url: song.song_path,
          title: song.title,
          artist: song.author,
          artwork: song.image_path,
        }));

        await TrackPlayer.add(tracks);

        // キューの状態を更新
        queueContext.current.originalQueue = [...tracks];
        queueContext.current.currentQueue = tracks.map((track) => ({
          id: track.id as string,
        }));

        return true;
      } catch (error) {
        handleError(error, "新しいキューの作成中にエラーが発生しました");
        return false;
      }
    },
    [handleError]
  );

  /**
   * キューの状態を取得する
   * 
   * @returns 現在のキュー状態
   */
  const getQueueState = useCallback(() => {
    return queueContext.current;
  }, []);

  /**
   * シャッフルモードを設定する
   * 
   * @param enabled - シャッフルモードを有効にするかどうか
   * @remarks
   * - シャッフルモードが変更された場合、キューの状態を更新
   * @throws {QueueManagerError} シャッフルモード設定中にエラーが発生した場合
   */
  const setShuffleMode = useCallback(
    async (enabled: boolean) => {
      try {
        const state = await TrackPlayer.getState();
        const currentTrack = await TrackPlayer.getActiveTrack();

        if (!currentTrack) {
          queueContext.current.isShuffleEnabled = enabled;
          return;
        }

        if (enabled) {
          // シャッフルモードON
          queueContext.current.isShuffleEnabled = true;
          await shuffleQueue();
        } else {
          // シャッフルモードOFF：元のキュー順序を復元
          queueContext.current.isShuffleEnabled = false;

          // 現在の曲のインデックスを元のキューから見つける
          const originalQueue = [...queueContext.current.originalQueue];
          const currentIndex = originalQueue.findIndex(
            (track) => track.id === currentTrack.id
          );

          if (currentIndex !== -1) {
            // 現在の曲から始まるように元のキューを並び替え
            const reorderedQueue = [
              ...originalQueue.slice(currentIndex),
              ...originalQueue.slice(0, currentIndex),
            ];

            await TrackPlayer.removeUpcomingTracks();
            await TrackPlayer.add(reorderedQueue.slice(1)); // 現在の曲以外を追加

            queueContext.current.currentQueue = reorderedQueue.map((track) => ({
              id: track.id as string,
            }));
          }
        }
      } catch (error: any) {
        if (error.message?.includes("player is not initialized")) {
          queueContext.current.isShuffleEnabled = enabled;
          return;
        }
        handleError(error, "シャッフルモードの設定中にエラーが発生しました");
      }
    },
    [handleError, shuffleQueue]
  );

  return {
    shuffleQueue,
    addToQueue,
    playNewQueue,
    getQueueState,
    setShuffleMode,
  };
}
