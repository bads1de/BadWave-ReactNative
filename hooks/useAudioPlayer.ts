import { useEffect, useCallback, useRef, useMemo, useState } from "react";
import TrackPlayer, {
  Event,
  RepeatMode,
  State,
  useTrackPlayerEvents,
  usePlaybackState,
  useProgress,
} from "react-native-track-player";
import Song from "../types";
import { usePlayerStore } from "./usePlayerStore";

/**
 * オーディオプレーヤーのカスタムフック。
 * 曲の再生、一時停止、シーク、リピート、シャッフルなどの機能を提供する。
 *
 * @param {Song[]} songs 再生する曲のリスト
 * @returns {object} オーディオプレーヤーの各種状態と操作関数
 */
export function useAudioPlayer(songs: Song[]) {
  const {
    currentSong,
    isPlaying,
    repeat,
    shuffle,
    setCurrentSong,
    setIsPlaying,
    setRepeat,
    setShuffle,
  } = usePlayerStore();

  // TrackPlayer のステートとプログレスを使用
  const playbackState = usePlaybackState();
  const { position, duration } = useProgress();

  // 曲のIDをキー、songs配列内のインデックスを値とするオブジェクト
  const songIndexMap = useMemo(() => {
    return songs.reduce((acc, song, index) => {
      acc[song.id] = index;
      return acc;
    }, {} as Record<string, number>);
  }, [songs]);

  // TrackPlayerのイベントを監視
  useTrackPlayerEvents([Event.PlaybackState, Event.PlaybackError], async (event) => {
    if (event.type === Event.PlaybackState) {
      if (event.state === State.Playing) {
        setIsPlaying(true);
      } else if (
        event.state === State.Paused ||
        event.state === State.Stopped ||
        event.state === State.None
      ) {
        setIsPlaying(false);
      }
    } else if (event.type === Event.PlaybackError) {
      console.error("Playback error:", event.message);
    }
  });

  /**
   * 再生状態の監視
   */
  useEffect(() => {
    const updatePlaybackState = async () => {
      const state = await TrackPlayer.getState();
      setIsPlaying(state === State.Playing);
    };

    updatePlaybackState();
  }, [playbackState, setIsPlaying]);

  /**
   * リピートモードの設定
   */
  useEffect(() => {
    const updateRepeatMode = async () => {
      await TrackPlayer.setRepeatMode(
        repeat ? RepeatMode.Queue : RepeatMode.Off
      );
    };

    updateRepeatMode();
  }, [repeat]);

  /**
   * 指定された曲を再生する
   */
  const playSong = useCallback(
    async (song: Song) => {
      if (!song) return;

      try {
        // 現在のキューをリセット
        await TrackPlayer.reset();

        // 曲のURLを取得する
        const songUrl = song.song_path;

        if (!songUrl) {
          console.error("曲の読み込み中にエラーが発生しました。");
          return;
        }

        // 曲をキューに追加
        await TrackPlayer.add({
          id: song.id,
          url: songUrl,
          title: song.title,
          artist: song.author,
          artwork: song.image_path || undefined,
          // 追加のメタデータがあれば設定
          genre: song.genre,
          // duration: 0, // 自動的に計算される
        });

        // 再生を開始
        await TrackPlayer.play();
        setCurrentSong(song);
        setIsPlaying(true);
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
          // 引数でsongが渡された場合
          if (currentSong?.id === song.id) {
            // 現在再生中の曲と同じであれば、再生/一時停止を切り替える
            const state = await TrackPlayer.getState();
            if (state === State.Playing) {
              await TrackPlayer.pause();
            } else {
              await TrackPlayer.play();
            }
            return;
          }
          // 違う曲であれば、その曲を再生する
          await playSong(song);
          return;
        }

        // 引数でsongが渡されなかった場合、現在再生中の曲の再生/一時停止を切り替える
        const state = await TrackPlayer.getState();
        if (state === State.Playing) {
          await TrackPlayer.pause();
        } else {
          await TrackPlayer.play();
        }
      } catch (error) {
        console.error("再生/一時停止エラー:", error);
      }
    },
    [currentSong, playSong]
  );

  /**
   * 次に再生する曲のインデックスを取得する
   */
  const getNextSongIndex = useCallback(() => {
    if (!currentSong || !songs.length) return 0;

    if (shuffle) {
      // シャッフルが有効な場合は、ランダムなインデックスを返す
      return Math.floor(Math.random() * songs.length);
    }

    // シャッフルが無効な場合は、現在の曲の次のインデックスを返す
    const currentIndex = songIndexMap[currentSong.id] ?? -1;
    return (currentIndex + 1) % songs.length;
  }, [currentSong, songs, shuffle, songIndexMap]);

  /**
   * 次の曲を再生する
   */
  const playNextSong = useCallback(async () => {
    if (!songs.length) return;

    try {
      if (shuffle) {
        // シャッフルが有効な場合は、ランダムな曲を再生
        const nextIndex = Math.floor(Math.random() * songs.length);
        await playSong(songs[nextIndex]);
      } else {
        // 通常の場合は、次の曲を再生
        const queue = await TrackPlayer.getQueue();
        if (queue.length > 0) {
          const currentIndex = await TrackPlayer.getCurrentTrack();
          if (currentIndex !== null && currentIndex < queue.length - 1) {
            // キュー内に次の曲がある場合
            await TrackPlayer.skipToNext();
          } else {
            // キューの最後の曲の場合、または不明な場合
            const nextIndex = getNextSongIndex();
            await playSong(songs[nextIndex]);
          }
        } else {
          // キューが空の場合
          const nextIndex = getNextSongIndex();
          await playSong(songs[nextIndex]);
        }
      }
    } catch (error) {
      console.error("次の曲の再生エラー:", error);
    }
  }, [songs, shuffle, playSong, getNextSongIndex]);

  /**
   * 前の曲を再生する
   */
  const playPrevSong = useCallback(async () => {
    if (!songs.length || !currentSong) return;

    try {
      if (shuffle) {
        // シャッフルが有効な場合は、ランダムな曲を再生
        const prevIndex = Math.floor(Math.random() * songs.length);
        await playSong(songs[prevIndex]);
      } else {
        // 通常の場合は、前の曲を再生
        const currentPosition = await TrackPlayer.getPosition();
        if (currentPosition > 3) {
          // 現在の曲が3秒以上再生されている場合は、曲の先頭に戻る
          await TrackPlayer.seekTo(0);
        } else {
          // 3秒未満の場合は、前の曲を再生
          const queue = await TrackPlayer.getQueue();
          if (queue.length > 0) {
            const currentIndex = await TrackPlayer.getCurrentTrack();
            if (currentIndex !== null && currentIndex > 0) {
              // キュー内に前の曲がある場合
              await TrackPlayer.skipToPrevious();
            } else {
              // キューの最初の曲の場合、または不明な場合
              const currentIndex = songIndexMap[currentSong.id] ?? -1;
              const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
              await playSong(songs[prevIndex]);
            }
          } else {
            // キューが空の場合
            const currentIndex = songIndexMap[currentSong.id] ?? -1;
            const prevIndex = (currentIndex - 1 + songs.length) % songs.length;
            await playSong(songs[prevIndex]);
          }
        }
      }
    } catch (error) {
      console.error("前の曲の再生エラー:", error);
    }
  }, [songs, currentSong, shuffle, songIndexMap, playSong]);

  /**
   * 再生を停止し、状態をリセットする
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

  /**
   * 指定されたミリ秒にシークする
   */
  const seekTo = useCallback(async (millis: number) => {
    try {
      // TrackPlayerはミリ秒ではなく秒単位で指定する必要がある
      await TrackPlayer.seekTo(millis / 1000);
    } catch (error) {
      console.error("シークエラー:", error);
    }
  }, []);

  return {
    isPlaying,
    currentSong,
    position: position * 1000, // 秒からミリ秒に変換
    duration: duration * 1000, // 秒からミリ秒に変換
    playSong,
    togglePlayPause,
    playNextSong,
    playPrevSong,
    stop,
    seekTo,
    repeat,
    setRepeat,
    shuffle,
    setShuffle,
  };
}
