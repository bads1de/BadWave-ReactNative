import { useEffect, useCallback, useRef } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";
import Song from "../types";
import { usePlayerStore } from "./usePlayerStore";
import useLoadSongUrl from "./useLoadSongUrl";

export function useAudioPlayer(songs: Song[]) {
  const {
    sound,
    currentSong,
    isPlaying,
    position,
    duration,
    repeat,
    shuffle,
    setSound,
    setCurrentSong,
    setIsPlaying,
    setPosition,
    setDuration,
    setRepeat,
    setShuffle,
  } = usePlayerStore();

  const nextSongRef = useRef<() => Promise<void>>(async () => {});

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);

  const unloadSound = async () => {
    if (sound) {
      try {
        await sound.unloadAsync();
        setSound(null);
      } catch (error) {
        console.error("サウンド解放エラー:", error);
      }
    }
  };

  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch((error: any) => {
          console.error("クリーンアップエラー:", error);
        });
      }
    };
  }, [sound]);

  const onPlaybackStatusUpdate = async (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;

    const currentStatus = await sound?.getStatusAsync();

    if (status.isPlaying && sound && currentStatus?.isLoaded) {
      if (currentStatus.positionMillis !== status.positionMillis) {
        await sound.stopAsync();
        return;
      }
    }

    if (position !== status.positionMillis) {
      setPosition(status.positionMillis);
    }
    if (duration !== (status.durationMillis || 0)) {
      setDuration(status.durationMillis || 0);
    }

    if (status.didJustFinish) {
      if (repeat) {
        if (sound) {
          try {
            await sound.setPositionAsync(0);
            await sound.playAsync();
          } catch (error) {
            console.error("リピート再生エラー:", error);
          }
        }
      } else {
        nextSongRef.current();
      }
    }
  };

  const playSong = async (song: Song) => {
    if (!song) return;

    try {
      await unloadSound();

      setCurrentSong(song);
      setIsPlaying(false);

      const songUrl = await useLoadSongUrl(song);

      if (!songUrl) {
        console.error("曲の読み込み中にエラーが発生しました。");
        setIsPlaying(false);
        setSound(null);
        return;
      }

      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: songUrl },
          {
            shouldPlay: true,
            progressUpdateIntervalMillis: 500,
          },
          onPlaybackStatusUpdate
        );

        setSound(newSound);
        setIsPlaying(true);
      } catch (error) {
        console.error("再生エラー:", error);
        setIsPlaying(false);
        setSound(null);
      }
    } catch (error) {
      console.error("再生前のエラー:", error);
    }
  };

  const togglePlayPause = async (song?: Song) => {
    if (!sound) return;

    try {
      const status = await sound.getStatusAsync();

      if (song) {
        if (currentSong?.id === song.id) {
          if (status.isLoaded) {
            if (status.isPlaying) {
              await sound.pauseAsync();
              setIsPlaying(false);
            } else {
              await sound.playAsync();
              setIsPlaying(true);
            }
          }
          return;
        }
        await playSong(song);
        return;
      }

      if (currentSong && status.isLoaded) {
        if (status.isPlaying) {
          await sound.pauseAsync();
          setIsPlaying(false);
        } else {
          await sound.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error("再生/一時停止エラー:", error);
    }
  };

  const playNextSong = useCallback(async () => {
    if (!songs.length) return;

    if (repeat && currentSong) {
      await playSong(currentSong);
      return;
    }

    const currentIndex = songs.findIndex((s) => s.id === currentSong?.id);
    const nextIndex = shuffle
      ? Math.floor(Math.random() * songs.length)
      : (currentIndex + 1) % songs.length;

    try {
      await playSong(songs[nextIndex]);
    } catch (error) {
      console.error("次の曲の再生エラー:", error);
    }
  }, [currentSong, songs, shuffle, repeat, playSong]);

  useEffect(() => {
    nextSongRef.current = playNextSong;
  }, [playNextSong]);

  const playPrevSong = useCallback(async () => {
    if (!songs.length) return;

    const currentIndex = songs.findIndex((s) => s.id === currentSong?.id);
    const prevIndex = shuffle
      ? Math.floor(Math.random() * songs.length)
      : (currentIndex - 1 + songs.length) % songs.length;

    try {
      await playSong(songs[prevIndex]);
    } catch (error) {
      console.error("前の曲の再生エラー:", error);
    }
  }, [currentSong, songs, shuffle, playSong]);

  const stop = async () => {
    if (!sound) return;

    try {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setCurrentSong(null);
      setPosition(0);
      setDuration(0);
    } catch (error) {
      console.error("停止エラー:", error);
    }
  };

  const seekTo = async (millis: number) => {
    if (!sound) return;

    try {
      await sound.setPositionAsync(millis);
      setPosition(millis);
    } catch (error) {
      console.error("シークエラー:", error);
    }
  };

  return {
    sound,
    isPlaying,
    currentSong,
    position,
    duration,
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
