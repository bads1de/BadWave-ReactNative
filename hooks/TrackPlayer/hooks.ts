// hooks/TrackPlayer/hooks.ts
import { useCallback, useMemo, useRef } from "react";
import TrackPlayer, { Track } from "react-native-track-player";
import Song from "../../types";
import { PlayContext, PlayContextType, QueueState } from "./types";
import { convertToTracks, logError } from "./utils";

/**
 * プレイヤーの状態管理を行うカスタムフック
 */
export function usePlayerState({ songs }: { songs: Song[] }) {
  // 曲のIDをキーとする曲データマップとトラックマップを作成
  return useMemo(() => {
    const songMap: Record<string, Song> = {};
    const trackMap: Record<string, Track> = {};

    songs.forEach((song) => {
      songMap[song.id] = song;
      trackMap[song.id] = {
        id: song.id,
        url: song.song_path,
        title: song.title,
        artist: song.author,
        artwork: song.image_path,
      };
    });

    return { songMap, trackMap };
  }, [songs]);
}

/**
 * キュー操作フック
 */
export function useQueueOperations(
  setIsPlaying: (isPlaying: boolean) => void,
  songMap: Record<string, Song>,
  trackMap: Record<string, Track>
) {
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
      logError(error, "キューのシャッフル中にエラーが発生しました");
      setIsPlaying(false);
    }
  }, [setIsPlaying]);

  /**
   * シャッフルを解除して元のキュー順序に戻す
   */
  const unshuffleQueue = useCallback(async () => {
    try {
      const currentTrack = await TrackPlayer.getActiveTrack();

      if (!currentTrack || queueContext.current.originalQueue.length === 0) {
        return;
      }

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
      logError(error, "シャッフル解除中にエラーが発生しました");
      setIsPlaying(false);
    }
  }, [setIsPlaying]);

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
        logError(error, "キューの更新中にエラーが発生しました");
        setIsPlaying(false);
      }
    },
    [setIsPlaying]
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
        logError(error, "キューに曲を追加中にエラーが発生しました");
      }
    },
    []
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
      logError(error, "キューのリセット中にエラーが発生しました");
    }
  }, []);

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
