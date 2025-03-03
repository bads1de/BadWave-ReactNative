import { useCallback, useEffect, useRef, useState } from "react";
import TrackPlayer, {
  State,
  usePlaybackState,
  useProgress,
  RepeatMode,
  Event,
} from "react-native-track-player";
import { calculateProgress, useCleanup } from "./TrackPlayer/utils";
import Song from "../types";
import useOnPlay from "./useOnPlay";
import { usePlayerState } from "./TrackPlayer/state";
import { useQueueOperations } from "./TrackPlayer/queue";

export function useAudioPlayer(songs: Song[]) {
  const { songMap, trackMap } = usePlayerState({ songs });
  const onPlay = useOnPlay();
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const isMounted = useRef(true);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>(RepeatMode.Off);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [isPlayingState, setIsPlayingState] = useState<boolean>(false);

  useCleanup(isMounted);

  const playbackState = usePlaybackState();
  const isPlaying = playbackState.state === State.Playing;
  const { position: rawPosition, duration: rawDuration } = useProgress();
  const { progressPosition, progressDuration } = calculateProgress(
    rawPosition,
    rawDuration
  );

  // isPlayingの状態が変わったらsetIsPlayingStateを呼び出す
  useEffect(() => {
    setIsPlayingState(isPlaying);
  }, [isPlaying]);

  const { playNewQueue, setShuffleMode, getQueueState } = useQueueOperations(
    isMounted,
    setIsPlayingState,
    songMap,
    trackMap
  );

  // トラック変更イベントの監視
  useEffect(() => {
    const handleTrackChange = async () => {
      if (!isMounted.current) return;

      try {
        const trackIndex = await TrackPlayer.getActiveTrackIndex();
        if (trackIndex !== null && trackIndex !== undefined) {
          const queue = await TrackPlayer.getQueue();
          const track = queue[trackIndex];
          if (track && track.id) {
            const song = songMap[track.id as string];
            if (song) {
              setCurrentSong(song);
              const queueState = getQueueState();
              queueState.lastProcessedTrackId = song.id;
            }
          }
        }
      } catch (error) {}
    };

    // 初期トラックの設定
    handleTrackChange();

    const unsubscribe = TrackPlayer.addEventListener(
      Event.PlaybackActiveTrackChanged,
      handleTrackChange
    );

    return () => {
      unsubscribe.remove();
    };
  }, [songMap, getQueueState]);

  // シャッフルモードの変更を監視
  useEffect(() => {
    setShuffleMode(shuffle);
  }, [shuffle, setShuffleMode]);

  // 再生/一時停止を切り替える
  const togglePlayPause = useCallback(
    async (song?: Song, playlistId?: string) => {
      try {
        if (song) {
          if (currentSong?.id === song.id) {
            if (isPlaying) {
              await TrackPlayer.pause();
            } else {
              await TrackPlayer.play();
            }
          } else {
            const success = await playNewQueue(song, songs, playlistId);
            if (success) {
              setCurrentSong(song);
              await onPlay(song.id);
              await TrackPlayer.play();
            }
          }
          return;
        }

        if (currentSong) {
          if (isPlaying) {
            await TrackPlayer.pause();
          } else {
            await TrackPlayer.play();
          }
        }
      } catch (error) {
        console.error("Error in togglePlayPause:", error);
      }
    },
    [currentSong, isPlaying, playNewQueue, onPlay, songs]
  );

  // 指定された位置にシークする
  const seekTo = useCallback(async (millis: number) => {
    try {
      await TrackPlayer.seekTo(millis / 1000);
    } catch (error) {
      console.error("Error seeking to position:", error);
    }
  }, []);

  // 次の曲を再生する
  const playNextSong = useCallback(async () => {
    try {
      const queue = await TrackPlayer.getQueue();
      const currentIndex = await TrackPlayer.getCurrentTrack();

      if (currentIndex === null) {
        console.log("No current track");
        return;
      }

      if (repeatMode === RepeatMode.Track) {
        console.log("Track repeat mode - restarting current track");
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
        return;
      }

      if (currentIndex === queue.length - 1) {
        if (repeatMode === RepeatMode.Queue) {
          await TrackPlayer.skip(0);
          await TrackPlayer.play();
        } else {
          await TrackPlayer.seekTo(0);
          await TrackPlayer.pause();
        }
      } else {
        await TrackPlayer.skipToNext();
        await TrackPlayer.play();
      }
    } catch (error) {
      console.error("Error in playNextSong:", error);
    }
  }, [repeatMode]);

  // 前の曲を再生する
  const playPrevSong = useCallback(async () => {
    try {
      const currentIndex = await TrackPlayer.getCurrentTrack();
      const queue = await TrackPlayer.getQueue();

      if (currentIndex === null) {
        return;
      }

      if (repeatMode === RepeatMode.Track) {
        await TrackPlayer.seekTo(0);
        await TrackPlayer.play();
        return;
      }

      if (currentIndex === 0) {
        if (repeatMode === RepeatMode.Queue) {
          await TrackPlayer.skip(queue.length - 1);
          await TrackPlayer.play();
        } else {
          await TrackPlayer.seekTo(0);
          await TrackPlayer.play();
        }
      } else {
        await TrackPlayer.skipToPrevious();
        await TrackPlayer.play();
      }
    } catch (error) {
      console.error("Error in playPrevSong:", error);
    }
  }, [repeatMode]);

  // 再生を停止する
  const stop = useCallback(async () => {
    try {
      await TrackPlayer.reset();
      setCurrentSong(null);
    } catch (error) {
      console.error("Error stopping playback:", error);
    }
  }, []);

  // リピートモードを設定する
  const handleSetRepeat = useCallback(async (mode: RepeatMode) => {
    try {
      await TrackPlayer.setRepeatMode(mode);
      setRepeatMode(mode);
    } catch (error) {
      console.error("Error setting repeat mode:", error);
    }
  }, []);

  return {
    currentSong,
    isPlaying,
    progressPosition,
    progressDuration,
    togglePlayPause,
    seekTo,
    playNextSong,
    playPrevSong,
    stop,
    repeatMode,
    setRepeatMode: handleSetRepeat,
    shuffle,
    setShuffle,
  };
}

export { RepeatMode, State };
