import { useState, useEffect, useCallback, useRef } from 'react';
import { Audio, AVPlaybackStatus } from 'expo-av';
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


  // コンポーネントのアンマウント時にクリーンアップ
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(error => {
          console.error('クリーンアップエラー:', error);
        });
      }
    };
  }, [sound]);


  // 再生状態の更新処理
  const onPlaybackStatusUpdate = async (status: AVPlaybackStatus) => {
    if (!status.isLoaded) return;
    
    // 新しい再生が開始される前に古い再生を停止
    if (status.isPlaying && sound) {
      const currentStatus = await sound.getStatusAsync();
      if (currentStatus.isLoaded && currentStatus.isPlaying && currentStatus.positionMillis !== status.positionMillis) {
        await sound.stopAsync();
        return;
      }
    }
    
    setPosition(status.positionMillis);
    setDuration(status.durationMillis || 0);

    if (status.didJustFinish) {
      if (repeat && sound) {
        try {
          await sound.setPositionAsync(0);
          await sound.playAsync();
        } catch (error) {
        // console.error('リピート再生エラー:', error);
          nextSongRef.current();
        }
      } else {
        nextSongRef.current();
      }
    }
  };


  // 曲の再生処理
  const playSong = async (song: Song) => {
    try {
      // 既存の音声を確実に停止・解放
      await unloadSound();
      
      // 新しい曲の設定（先にUIを更新）
      setCurrentSong(song);
      setIsPlaying(false);
      
      const { sound: newSound } = await Audio.Sound.createAsync(
        song.song_path,
        { 
          shouldPlay: true,  // 自動再生を有効に
          progressUpdateIntervalMillis: 500 
        },
        onPlaybackStatusUpdate
      );
      
      setSound(newSound);
      setIsPlaying(true);
    } catch (error) {
      console.error('再生エラー:', error);
      setIsPlaying(false);
      setSound(null);
    }
  };


  // 再生/一時停止の切り替え
  const togglePlayPause = async (song?: Song) => {
    try {
      // 新しい曲が指定された場合
      if (song) {
        // 現在の曲と同じ場合は再生/一時停止を切り替え
        if (currentSong?.id === song.id && sound) {
          const status = await sound.getStatusAsync();
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
        // 新しい曲を再生
        setCurrentSong(song);  // すぐにUIを更新するため、先にセット
        await playSong(song);
        return;
      }

      // 曲が再生中の場合、再生/一時停止を切り替え
      if (sound && currentSong) {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
            setIsPlaying(false);
          } else {
            await sound.playAsync();
            setIsPlaying(true);
          }
        }
      }
    } catch (error) {
      console.error('再生/一時停止エラー:', error);
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
