import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Asset } from 'expo-asset';
import Song from '../types';

export function useAudioPlayer(songs: Song[]) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  

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

  // 既存のサウンドがあれば停止・解放
  const unloadSound = async () => {
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch (err) {
        console.error('サウンド解放エラー:', err);
      }
    }
  };

  // 再生状態の更新（完了時はリピート or 次曲再生）
  const onPlaybackStatusUpdate = (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    setPosition(status.positionMillis);
    setDuration(status.durationMillis || 0);
    if (status.didJustFinish) {
      if (repeat && sound) {
        sound.setPositionAsync(0).then(() => sound.playAsync());
      } else {
        nextSongRef.current();
      }
    }
  };

  const playSong = async (song: Song) => {
    await unloadSound();
    try {
      const asset = Asset.fromModule(song.song_path);
      await asset.downloadAsync();
      const { sound: newSound } = await Audio.Sound.createAsync(
        asset,
        { shouldPlay: true, progressUpdateIntervalMillis: 500 },
        onPlaybackStatusUpdate
      );
      setSound(newSound);
      setCurrentSong(song);
      setIsPlaying(true);
    } catch (err) {
      console.error('再生エラー:', err);
    }
  };

  const togglePlayPause = async (song?: Song) => {
    // 引数があれば新規再生
    if (song) {
      await playSong(song);
      return;
    }
    // 同曲の場合は再生/一時停止
    if (sound) {
      const status = await sound.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
    }
  };

  const playNextSong = useCallback(async () => {
    if (!songs.length) return;
    let nextSong: Song;
    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      nextSong = songs[randomIndex];
    } else {
      const currentIndex = songs.findIndex(s => s.id === currentSong?.id);
      nextSong = songs[(currentIndex + 1) % songs.length];
    }
    await playSong(nextSong);
  }, [currentSong, songs, shuffle]);


  useEffect(() => {
    nextSongRef.current = playNextSong;
  }, [playNextSong]);

  const playPrevSong = useCallback(async () => {
    if (!songs.length) return;
    let prevSong: Song;
    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      prevSong = songs[randomIndex];
    } else {
      const currentIndex = songs.findIndex(s => s.id === currentSong?.id);
      prevSong = songs[(currentIndex - 1 + songs.length) % songs.length];
    }
    await playSong(prevSong);
  }, [currentSong, songs, shuffle]);

  const stop = async () => {
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      setCurrentSong(null);
      setPosition(0);
      setDuration(0);
    }
  };

  const seekTo = async (millis: number) => {
    if (sound) {
      await sound.setPositionAsync(millis);
      setPosition(millis);
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
