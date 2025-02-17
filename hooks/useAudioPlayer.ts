import { useEffect, useCallback, useRef, useMemo } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";
import Song from "../types";
import { usePlayerStore } from "./usePlayerStore";
import loadSongUrl from "@/actions/LoadSongUrl";

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

  // メモ化されたソング配列のインデックスマップ
  const songIndexMap = useMemo(() => {
    return songs.reduce((acc, song, index) => {
      acc[song.id] = index;
      return acc;
    }, {} as Record<string, number>);
  }, [songs]);

  const nextSongRef = useRef<() => Promise<void>>(async () => {});

  // ステータス更新用のデバウンス
  const statusUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 最後のポジション更新時刻を追跡
  const lastPositionUpdateRef = useRef<number>(0);

  // Audio モードの設定を初期化時のみ実行
  useEffect(() => {
    const initAudioMode = async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        staysActiveInBackground: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
    };
    initAudioMode();
  }, []);

  const unloadSound = useCallback(async () => {
    if (sound) {
      try {
        await sound.unloadAsync();
        setSound(null);
      } catch (error) {
        console.error("サウンド解放エラー:", error);
      }
    }
  }, [sound, setSound]);

  useEffect(() => {
    return () => {
      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
      }
      unloadSound();
    };
  }, [unloadSound]);

  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;

      const now = Date.now();
      // ポジション更新を100ms以上の間隔に制限
      if (now - lastPositionUpdateRef.current >= 100) {
        if (position !== status.positionMillis) {
          setPosition(status.positionMillis);
        }
        if (duration !== (status.durationMillis || 0)) {
          setDuration(status.durationMillis || 0);
        }
        lastPositionUpdateRef.current = now;
      }

      if (status.didJustFinish) {
        if (repeat && sound) {
          sound
            .setPositionAsync(0)
            .then(() => sound.playAsync())
            .catch((error: any) => console.error("リピート再生エラー:", error));
        } else {
          nextSongRef.current();
        }
      }
    },
    [position, duration, repeat, sound, setPosition, setDuration]
  );

  const playSong = useCallback(
    async (song: Song) => {
      if (!song) return;

      try {
        await unloadSound();
        setCurrentSong(song);
        setIsPlaying(false);

        const songUrl = await loadSongUrl(song);
        if (!songUrl) {
          console.error("曲の読み込み中にエラーが発生しました。");
          return;
        }

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: songUrl },
          {
            shouldPlay: true,
            progressUpdateIntervalMillis: 1000,
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
    },
    [
      unloadSound,
      setCurrentSong,
      setIsPlaying,
      setSound,
      onPlaybackStatusUpdate,
    ]
  );

  const togglePlayPause = useCallback(
    async (song?: Song) => {
      if (!sound) return;

      try {
        const status = await sound.getStatusAsync();

        if (song) {
          if (currentSong?.id === song.id) {
            if (status.isLoaded) {
              await (status.isPlaying ? sound.pauseAsync() : sound.playAsync());
              setIsPlaying(!status.isPlaying);
            }
            return;
          }
          await playSong(song);
          return;
        }

        if (currentSong && status.isLoaded) {
          await (status.isPlaying ? sound.pauseAsync() : sound.playAsync());
          setIsPlaying(!status.isPlaying);
        }
      } catch (error) {
        console.error("再生/一時停止エラー:", error);
      }
    },
    [sound, currentSong, playSong, setIsPlaying]
  );

  const getNextSongIndex = useCallback(() => {
    if (!currentSong || !songs.length) return 0;

    if (shuffle) {
      return Math.floor(Math.random() * songs.length);
    }

    const currentIndex = songIndexMap[currentSong.id] ?? -1;
    return (currentIndex + 1) % songs.length;
  }, [currentSong, songs, shuffle, songIndexMap]);

  const playNextSong = useCallback(async () => {
    if (!songs.length) return;

    if (repeat && currentSong) {
      await playSong(currentSong);
      return;
    }

    try {
      const nextIndex = getNextSongIndex();
      await playSong(songs[nextIndex]);
    } catch (error) {
      console.error("次の曲の再生エラー:", error);
    }
  }, [songs, repeat, currentSong, playSong, getNextSongIndex]);

  useEffect(() => {
    nextSongRef.current = playNextSong;
  }, [playNextSong]);

  const seekTo = useCallback(
    async (millis: number) => {
      if (!sound) return;

      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
      }

      try {
        await sound.setPositionAsync(millis);

        statusUpdateTimeoutRef.current = setTimeout(() => {
          setPosition(millis);
        }, 50);
      } catch (error) {
        console.error("シークエラー:", error);
      }
    },
    [sound, setPosition]
  );

  return {
    sound,
    isPlaying,
    currentSong,
    position,
    duration,
    playSong,
    togglePlayPause,
    playNextSong,
    playPrevSong: useCallback(async () => {
      if (!songs.length || !currentSong) return;

      const currentIndex = songIndexMap[currentSong.id] ?? -1;
      const prevIndex = shuffle
        ? Math.floor(Math.random() * songs.length)
        : (currentIndex - 1 + songs.length) % songs.length;

      try {
        await playSong(songs[prevIndex]);
      } catch (error) {
        console.error("前の曲の再生エラー:", error);
      }
    }, [songs, currentSong, shuffle, songIndexMap, playSong]),
    stop: useCallback(async () => {
      if (!sound) return;

      try {
        await unloadSound();
        setIsPlaying(false);
        setCurrentSong(null);
        setPosition(0);
        setDuration(0);
      } catch (error) {
        console.error("停止エラー:", error);
      }
    }, [
      sound,
      unloadSound,
      setIsPlaying,
      setCurrentSong,
      setPosition,
      setDuration,
    ]),
    seekTo,
    repeat,
    setRepeat,
    shuffle,
    setShuffle,
  };
}
