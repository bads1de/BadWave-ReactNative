import { useEffect, useCallback, useMemo } from "react";
import TrackPlayer, {
  RepeatMode,
  State,
  usePlaybackState,
  useProgress,
} from "react-native-track-player";
import Song from "../types";
import { usePlayerStore } from "./usePlayerStore";
import {
  playSong as playTrack,
  toggleShuffle,
  toggleRepeat,
  skipToNext,
  skipToPrevious,
} from "../services/PlayerService";

/**
 * オーディオプレーヤーのカスタムフック。
 * TrackPlayerを使用して曲の再生、一時停止、シーク、リピート、シャッフルなどの機能を提供する。
 *
 * @param {Song[]} songs 再生する曲のリスト
 * @returns {object} オーディオプレーヤーの各種状態と操作関数
 */
export function useAudioPlayer(songs: Song[]) {
  const {
    currentSong,
    isPlaying,
    repeatMode,
    shuffle,
    setCurrentSong,
    setIsPlaying,
    setRepeatMode,
    setShuffle,
  } = usePlayerStore();

  // TrackPlayerの現在の再生状態を取得
  const playbackState = usePlaybackState();
   
  // 再生位置の進捗を直接取得（ミリ秒に変換）
  const { position: rawPosition, duration: rawDuration } = useProgress();
  const progressPosition = rawPosition * 1000;
  const progressDuration = rawDuration * 1000;

  // 曲のIDをキー、songs配列内のインデックスを値とするマップを作成
  const songIndexMap = useMemo(() => {
    return songs.reduce((acc, song, index) => {
      acc[song.id] = index;
      return acc;
    }, {} as Record<string, number>);
  }, [songs]);

  // 再生状態を同期
  useEffect(() => {
    setIsPlaying(playbackState.state === State.Playing);
  }, [playbackState, setIsPlaying]);

  // リピートモードを同期
  useEffect(() => {
    const syncRepeatMode = async () => {
      try {
        const currentMode = await TrackPlayer.getRepeatMode();
        if (currentMode !== repeatMode) {
          setRepeatMode(currentMode);
        }
      } catch (error) {
        console.error('リピートモード同期エラー:', error);
      }
    };

    syncRepeatMode();
  }, [repeatMode, setRepeatMode]);

  /**
   * 指定された曲を再生する
   */
  const playSong = useCallback(
    async (song: Song) => {
      if (!song) return;

      try {
        setCurrentSong(song);
        await playTrack(song.song_path);
      } catch (error) {
        console.error("再生エラー:", error);
        setIsPlaying(false);
      }
    },
    [setCurrentSong, setIsPlaying]
  );

  /**
   * 再生/一時停止を切り替える
   */
  const togglePlayPause = useCallback(
    async (song?: Song) => {
      try {
        if (song) {
          if (currentSong?.id === song.id) {
            // 同じ曲の場合は再生/一時停止を切り替え
            if (isPlaying) {
              await TrackPlayer.pause();
            } else {
              await TrackPlayer.play();
            }
          } else {
            // 異なる曲の場合は新しい曲を再生
            await playSong(song);
          }
          return;
        }

        // songが指定されていない場合は現在の曲の再生/一時停止を切り替え
        if (currentSong) {
          if (isPlaying) {
            await TrackPlayer.pause();
          } else {
            await TrackPlayer.play();
          }
        }
      } catch (error) {
        console.error("再生/一時停止エラー:", error);
      }
    },
    [currentSong, isPlaying, playSong]
  );

  /**
   * 指定されたミリ秒にシークする
   */
  const seekTo = useCallback(async (millis: number) => {
    try {
      await TrackPlayer.seekTo(millis / 1000); // ミリ秒から秒に変換
    } catch (error) {
      console.error("シークエラー:", error);
    }
  }, []);

  /**
   * 次の曲を再生する
   */
  const playNextSong = useCallback(async () => {
    try {
      await skipToNext();
    } catch (error) {
      console.error("次の曲の再生エラー:", error);
    }
  }, []);

  /**
   * 前の曲を再生する
   */
  const playPrevSong = useCallback(async () => {
    try {
      await skipToPrevious();
    } catch (error) {
      console.error("前の曲の再生エラー:", error);
    }
  }, []);

  /**
   * 再生を停止する
   */
  const stop = useCallback(async () => {
    try {
      await TrackPlayer.reset();
      setIsPlaying(false);
      setCurrentSong(null);
    } catch (error) {
      console.error("停止エラー:", error);
    }
  }, [setIsPlaying, setCurrentSong]);

  // TrackPlayerのインスタンスを返す
  const sound = TrackPlayer;

  return {
    sound,
    isPlaying,
    currentSong,
    position: progressPosition,
    duration: progressDuration,
    playSong,
    togglePlayPause,
    playNextSong,
    playPrevSong,
    stop,
    seekTo,
    repeat: repeatMode === RepeatMode.Track || repeatMode === RepeatMode.Queue,
    repeatMode: (repeatMode === RepeatMode.Track ? 'track' : repeatMode === RepeatMode.Queue ? 'queue' : 'off') as 'off' | 'track' | 'queue',
    setRepeat: async (value: boolean) => {
      try {
        if (value) {
          const newMode = await toggleRepeat();
          setRepeatMode(newMode); // Zustand storeを更新
        } else {
          await TrackPlayer.setRepeatMode(RepeatMode.Off);
          setRepeatMode(RepeatMode.Off);
          console.log('リピートモードをOffに設定'); // デバッグログ
        }
      } catch (error) {
        
      }
    },
    shuffle,
    setShuffle: async (value: boolean) => {
      try {
        const newShuffleState = await toggleShuffle();
        setShuffle(newShuffleState);
      } catch (error) {
        console.error('シャッフルモード設定エラー:', error);
      }
    },
  };
}

// TrackPlayerの型をexport
export { RepeatMode, State };
