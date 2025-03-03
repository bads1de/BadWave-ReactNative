import { useEffect } from "react";
import TrackPlayer, { Event, State } from "react-native-track-player";
import type Song from "@/types";

type UsePlayerEventsProps = {
  isMounted: React.MutableRefObject<boolean>;
  songMap: Record<string, Song>;
  lastProcessedTrackId: React.MutableRefObject<string | null>;
  cleanupFns: React.MutableRefObject<(() => void)[]>;
  safeStateUpdate: (callback: () => void) => void;
  setCurrentSong: (song: Song) => void;
  setIsPlaying: (isPlaying: boolean) => void;
};

/**
 * プレイヤーのイベントハンドリングを管理するカスタムフック
 */
export function usePlayerEvents({
  isMounted,
  songMap,
  lastProcessedTrackId,
  cleanupFns,
  safeStateUpdate,
  setCurrentSong,
  setIsPlaying,
}: UsePlayerEventsProps) {
  // トラック変更のハンドリング
  useEffect(() => {
    const trackChangeSubscription = TrackPlayer.addEventListener(
      Event.PlaybackTrackChanged,
      async (event) => {
        if (!isMounted.current) return;

        if (event.nextTrack !== null && event.nextTrack !== undefined) {
          try {
            const queue = await TrackPlayer.getQueue();
            const nextTrack = queue[event.nextTrack];

            if (nextTrack && nextTrack.id) {
              // 重複更新を防止
              if (lastProcessedTrackId.current === nextTrack.id) {
                return;
              }

              const song = songMap[nextTrack.id];
              if (song) {
                lastProcessedTrackId.current = nextTrack.id;
                safeStateUpdate(() => setCurrentSong(song));
              }
            }
          } catch (error) {
            console.error("トラック変更イベントエラー:", error);
          }
        }
      }
    );

    cleanupFns.current.push(() => {
      trackChangeSubscription.remove();
    });

    return () => {
      trackChangeSubscription.remove();
    };
  }, [
    songMap,
    setCurrentSong,
    safeStateUpdate,
    isMounted,
    lastProcessedTrackId,
    cleanupFns,
  ]);

  // 再生状態の同期
  useEffect(() => {
    const playbackStateSubscription = TrackPlayer.addEventListener(
      Event.PlaybackState,
      async (event) => {
        if (isMounted.current) {
          safeStateUpdate(() => setIsPlaying(event.state === State.Playing));
        }
      }
    );

    cleanupFns.current.push(() => {
      playbackStateSubscription.remove();
    });

    return () => {
      playbackStateSubscription.remove();
    };
  }, [setIsPlaying, safeStateUpdate, isMounted, cleanupFns]);
}
