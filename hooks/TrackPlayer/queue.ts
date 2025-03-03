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
   * 新しいキューを再生する
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
