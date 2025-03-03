import { useCallback, MutableRefObject, useRef } from "react";
import TrackPlayer, { Track, Event } from "react-native-track-player";
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
    context: {
      type: null,
      id: undefined,
    },
  });

  /**
   * キューをシャッフルする
   */
  const shuffleQueue = useCallback(async () => {
    try {
      const currentTrack = await TrackPlayer.getActiveTrack();
      const queue = await TrackPlayer.getQueue();

      // 現在の曲を除外してシャッフル
      const remainingTracks = queue.filter(
        (track) => track.id !== currentTrack?.id
      );
      const shuffledTracks = [...remainingTracks].sort(
        () => Math.random() - 0.5
      );

      // 現在の曲を先頭に、シャッフルした曲を後ろに追加
      await TrackPlayer.removeUpcomingTracks();
      if (currentTrack) {
        await TrackPlayer.add([currentTrack, ...shuffledTracks]);
      } else {
        await TrackPlayer.add(shuffledTracks);
      }

      // キューの状態を更新
      queueContext.current.currentQueue = queue.map((track) => ({
        id: track.id as string,
      }));
    } catch (error) {
      handleError(error, "キューのシャッフル中にエラーが発生しました");
    }
  }, [handleError]);

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
   * 新しい曲をキューに追加して再生する
   */
  const playNewQueue = useCallback(
    async (song: Song, songs: Song[], playlistId?: string) => {
      try {
        await TrackPlayer.reset();
        const track = trackMap[song.id];

        if (!track) {
          throw new Error("トラックが見つかりません");
        }

        // コンテキストの更新
        queueContext.current = {
          ...queueContext.current,
          context: {
            type: playlistId ? "playlist" : "liked",
            id: playlistId,
          },
          lastProcessedTrackId: song.id,
        };

        // 曲の追加とメタデータの更新
        await TrackPlayer.add(track);
        await TrackPlayer.updateNowPlayingMetadata({
          ...track,
          title: song.title,
          artist: song.author,
        });

        // キューの状態を更新
        const newQueue = songs.map((s) => ({ id: s.id }));
        queueContext.current.currentQueue = newQueue;
        queueContext.current.originalQueue = convertToTracks(songs);

        await TrackPlayer.play();

        // シャッフルモードの場合はキューをシャッフル
        if (queueContext.current.isShuffleEnabled) {
          await shuffleQueue();
        }

        return true;
      } catch (error) {
        handleError(error, "新しいキューの再生中にエラーが発生しました");
        return false;
      }
    },
    [handleError, trackMap, shuffleQueue]
  );

  /**
   * キューの状態を取得する
   */
  const getQueueState = useCallback(() => {
    return queueContext.current;
  }, []);

  /**
   * シャッフルモードを設定する
   */
  const setShuffleMode = useCallback(
    async (enabled: boolean) => {
      try {
        // プレイヤーの初期化を確認
        const state = await TrackPlayer.getState();

        queueContext.current.isShuffleEnabled = enabled;
        if (enabled) {
          await shuffleQueue();
        } else {
          await TrackPlayer.removeUpcomingTracks();
          await TrackPlayer.add(queueContext.current.originalQueue);
        }
      } catch (error: any) {
        // プレイヤーが初期化されていない場合は状態のみ更新
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
