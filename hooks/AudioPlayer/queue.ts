import { useCallback, MutableRefObject, useRef } from "react";
import TrackPlayer from "react-native-track-player";
import type Song from "@/types";
import { queueManager } from "../../services/QueueManager";
import { convertToTracks } from "./track";
import { useSafeStateUpdate, useErrorHandler } from "./utils";
import useOnPlay from "../useOnPlay";

interface UseQueueOperationsProps {
  songs: Song[];
  trackMap: Record<string, any>;
  setCurrentSong: (song: Song | null) => void;
  setIsPlaying: (isPlaying: boolean) => void;
  shuffle: boolean;
  isMounted: MutableRefObject<boolean>;
}

export function useQueueOperations({
  songs,
  trackMap,
  setCurrentSong,
  setIsPlaying,
  shuffle,
  isMounted,
}: UseQueueOperationsProps) {
  // キュー操作中フラグ
  const isQueueOperationInProgress = useRef(false);

  // 最適化: 前回のトラックIDを追跡して、重複更新を防止
  const lastProcessedTrackId = useRef<string | null>(null);

  // ユーティリティ関数の初期化
  const safeStateUpdate = useSafeStateUpdate(isMounted);
  const handleError = useErrorHandler({ safeStateUpdate, setIsPlaying });

  // 再生回数更新関数を初期化
  const onPlay = useOnPlay();

  /**
   * 指定された曲を再生する (最適化版)
   */
  const playSong = useCallback(
    async (song: Song, playlistId?: string) => {
      if (!song || isQueueOperationInProgress.current) return;

      isQueueOperationInProgress.current = true;

      try {
        // 最適化: 即座に UI 状態を更新して体感速度を改善
        safeStateUpdate(() => {
          setCurrentSong(song);
          setIsPlaying(true);
        });

        // 最適化: 最後に処理されたトラックIDを更新
        lastProcessedTrackId.current = song.id;

        // 再生回数を更新
        await onPlay(song.id);

        // コンテキスト設定
        queueManager.setContext(playlistId ? "playlist" : "liked", playlistId);

        // 現在のキュー情報を確認
        const currentQueue = await TrackPlayer.getQueue();
        const selectedTrackIndex = currentQueue.findIndex(
          (track) => track.id === song.id
        );

        if (selectedTrackIndex !== -1) {
          // キューにすでに存在する場合は直接スキップ
          await TrackPlayer.skip(selectedTrackIndex);
          await TrackPlayer.play();
          isQueueOperationInProgress.current = false;
          return;
        }

        // キューに存在しない場合
        const track = trackMap[song.id];
        if (!track) {
          throw new Error("曲が見つかりません");
        }

        // キューをリセットして現在の曲を追加（UI応答性向上のため）
        await TrackPlayer.reset();
        await TrackPlayer.add([track]);

        // 再生開始
        const playPromise = TrackPlayer.play();

        // 非同期で残りの曲を追加（UIブロックを防止）
        setTimeout(() => {
          const remainingSongs = songs.filter((s) => s.id !== song.id);
          let remainingTracks;

          if (shuffle) {
            remainingTracks = queueManager.shuffleQueue(
              null,
              convertToTracks(remainingSongs)
            );
          } else {
            remainingTracks = convertToTracks(remainingSongs);
          }

          TrackPlayer.add(remainingTracks)
            .catch((e) => console.error("残りの曲の追加エラー:", e))
            .finally(() => {
              isQueueOperationInProgress.current = false;
            });
        }, 300);

        // 再生開始を待つ
        await playPromise;
      } catch (error) {
        handleError(error, "再生エラー");
        isQueueOperationInProgress.current = false;
      }
    },
    [
      songs,
      trackMap,
      setCurrentSong,
      setIsPlaying,
      shuffle,
      handleError,
      safeStateUpdate,
      onPlay,
    ]
  );

  return {
    playSong,
    isQueueOperationInProgress,
    lastProcessedTrackId,
  };
}
