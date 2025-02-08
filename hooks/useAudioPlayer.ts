import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
import { Asset } from 'expo-asset';
import Song from '../types';

// Audioプレーヤーのカスタムフック
export function useAudioPlayer(songs: Song[]) {
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);

  // 次の曲を再生するための参照
  const nextSongRef = useRef<() => Promise<void>>(async () => {});


  // オーディオモードの初期設定
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  }, []);


  // サウンドのクリーンアップ処理
  const unloadSound = async () => {
    if (sound) {
      try {
        await sound.unloadAsync();
      } catch (error) {
        console.error('サウンド解放エラー:', error);
      }
    }
  };


  // 再生状態の更新処理
  const onPlaybackStatusUpdate = async (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    
    setPosition(status.positionMillis);
    setDuration(status.durationMillis || 0);

    if (status.didJustFinish) {
      if (repeat && sound) {
        try {
          await sound.setPositionAsync(0);
          await sound.playAsync();
        } catch (error) {
          console.error('リピート再生エラー:', error);
          nextSongRef.current();
        }
      } else {
        nextSongRef.current();
      }
    }
  };


  // 曲の再生処理
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
    } catch (error) {
      console.error('再生エラー:', error);
    }
  };


  // 再生/一時停止の切り替え
  const togglePlayPause = async (song?: Song) => {
    if (song) {
      await playSong(song);
      return;
    }

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


  // 次の曲を再生
  const playNextSong = useCallback(async () => {
    if (!songs.length) return;
    
    if (repeat && currentSong) {
      await playSong(currentSong);
      return;
    }

    let nextSong: Song;
    if (shuffle) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      nextSong = songs[randomIndex];
    } else {
      const currentIndex = songs.findIndex(s => s.id === currentSong?.id);
      nextSong = songs[(currentIndex + 1) % songs.length];
    }
    
    await playSong(nextSong);
  }, [currentSong, songs, shuffle, repeat]);


  // nextSongRefの更新
  useEffect(() => {
    nextSongRef.current = playNextSong;
  }, [playNextSong]);


  // 前の曲を再生
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


  // 再生停止
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


  // 指定位置にシーク
  const seekTo = async (millis: number) => {
    if (sound) {
      await sound.setPositionAsync(millis);
      setPosition(millis);
    }
  };


  // フックの戻り値
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
