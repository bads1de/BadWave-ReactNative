import { useEffect, useCallback, useRef, useMemo, useState } from "react";
import { Audio, AVPlaybackStatus } from "expo-av";
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
    sound,
    currentSong,
    isPlaying,
    repeat,
    shuffle,
    setSound,
    setCurrentSong,
    setIsPlaying,
    setRepeat,
    setShuffle,
  } = usePlayerStore();

  // Local slider state for position and duration
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const positionUpdateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 曲のIDをキー、songs配列内のインデックスを値とするオブジェクト。
   * シャッフル時や次の曲の再生時に、効率的に曲を検索するために使用する。
   * @type {Record<string, number>}
   */
  const songIndexMap = useMemo(() => {
    return songs.reduce((acc, song, index) => {
      acc[song.id] = index;
      return acc;
    }, {} as Record<string, number>);
  }, [songs]);

  /**
   * 次の曲を再生するための関数を保持するref。
   * 曲の終了時に、リピート設定やシャッフル設定に応じて次の曲を再生するために使用する。
   */
  const nextSongRef = useRef<() => Promise<void>>(async () => {});

  /**
   * 再生状態の更新をデバウンスするためのタイマーのref。
   */
  const statusUpdateTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  /**
   * 最後にポジションを更新した時刻を記録するref。
   * ポジションの更新頻度を制限するために使用する。
   */
  const lastPositionUpdateRef = useRef<number>(0);

  /**
   * Audioモードを初期化する。
   * iOSでのバックグラウンド再生、サイレントモードでの再生などを設定する。
   */
  useEffect(() => {
    const initAudioMode = async () => {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false, // iOSでの録音を許可しない
        staysActiveInBackground: true, // バックグラウンドで再生を継続する
        playsInSilentModeIOS: true, // サイレントモードでも再生する
        shouldDuckAndroid: true, // 他のアプリの音量を下げる
        playThroughEarpieceAndroid: false, // イヤホンから再生しない
      });
    };
    initAudioMode();
  }, []);

  /**
   * サウンドオブジェクトを解放する。
   * コンポーネントのアンマウント時や、新しい曲を再生する前に呼び出される。
   */
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

  /**
   * コンポーネントのアンマウント時に、タイマーをクリアし、サウンドを解放する。
   */
  useEffect(() => {
    return () => {
      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
      }
      unloadSound();
    };
  }, [unloadSound]);

  /**
   * 再生状態の更新時に呼び出されるコールバック関数。
   * ポジション、デュレーションの更新、曲の終了処理などを行う。
   *
   * @param {AVPlaybackStatus} status Expo AVの再生状態オブジェクト
   */
  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded) return;

      const now = Date.now();
      // ポジションの更新を100ms間隔に制限する
      if (now - lastPositionUpdateRef.current >= 100) {
        setPosition(status.positionMillis);
        setDuration(status.durationMillis || 0);
        lastPositionUpdateRef.current = now;
      }

      // 曲が終了したときの処理
      if (status.didJustFinish) {
        if (repeat && sound) {
          // リピートが有効な場合は、曲を最初から再生する
          sound
            .setPositionAsync(0)
            .then(() => sound.playAsync())
            .catch((error: any) => console.error("リピート再生エラー:", error));
        } else {
          // リピートが無効な場合は、次の曲を再生する
          nextSongRef.current();
        }
      }
    },
    [repeat, sound]
  );

  /**
   * 指定された曲を再生する。
   *
   * @param {Song} song 再生する曲
   */
  const playSong = useCallback(
    async (song: Song) => {
      if (!song) return;

      try {
        // 既存のサウンドを解放する
        await unloadSound();
        setCurrentSong(song);
        setIsPlaying(false);
        setPosition(0);
        setDuration(0);

        // 曲のURLを取得する
        const songUrl = song.song_path;
        if (!songUrl) {
          console.error("曲の読み込み中にエラーが発生しました。");
          return;
        }

        // 新しいサウンドオブジェクトを作成し、再生を開始する
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

        // 初期状態を取得
        const initialStatus = await newSound.getStatusAsync();
        if (initialStatus.isLoaded) {
          setPosition(initialStatus.positionMillis);
          setDuration(initialStatus.durationMillis || 0);
        }
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

  /**
   * 再生/一時停止を切り替える。
   *
   * @param {Song} [song] 再生/一時停止する曲。省略された場合は、現在再生中の曲を対象とする。
   */
  const togglePlayPause = useCallback(
    async (song?: Song) => {
      if (!sound) return;

      try {
        const status = await sound.getStatusAsync();

        if (song) {
          // 引数でsongが渡された場合
          if (currentSong?.id === song.id) {
            // 現在再生中の曲と同じであれば、再生/一時停止を切り替える
            if (status.isLoaded) {
              await (status.isPlaying ? sound.pauseAsync() : sound.playAsync());
              setIsPlaying(!status.isPlaying);
            }
            return;
          }
          // 違う曲であれば、その曲を再生する
          await playSong(song);
          return;
        }

        // 引数でsongが渡されなかった場合、現在再生中の曲の再生/一時停止を切り替える
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

  /**
   * 次に再生する曲のインデックスを取得する。
   * シャッフルが有効な場合はランダムなインデックスを、そうでない場合は現在の曲の次のインデックスを返す。
   *
   * @returns {number} 次に再生する曲のインデックス
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
   * 次の曲を再生する。
   * リピートが有効な場合は現在の曲を再度再生、そうでない場合は次の曲を再生する。
   */
  const playNextSong = useCallback(async () => {
    if (!songs.length) return;

    if (repeat && currentSong) {
      // リピートが有効な場合は、現在の曲を再度再生する
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

  /**
   * playNextSong関数をnextSongRefに設定する。
   */
  useEffect(() => {
    nextSongRef.current = playNextSong;
  }, [playNextSong]);

  /**
   * 指定されたミリ秒にシークする。
   *
   * @param {number} millis シーク先のミリ秒
   */
  const seekTo = useCallback(
    async (millis: number) => {
      if (!sound) return;

      // 連続シークを防ぐため、タイマーをクリアする
      if (statusUpdateTimeoutRef.current) {
        clearTimeout(statusUpdateTimeoutRef.current);
      }

      try {
        await sound.setPositionAsync(millis);
        setPosition(millis);

        // シーク後に現在の状態を取得して更新
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 0);
        }
      } catch (error) {
        console.error("シークエラー:", error);
      }
    },
    [sound]
  );

  /**
   * 前の曲を再生する
   */
  const playPrevSong = useCallback(async () => {
    if (!songs.length || !currentSong) return;

    // 現在の曲のインデックスを取得
    const currentIndex = songIndexMap[currentSong.id] ?? -1;

    // 前の曲のインデックスを計算（シャッフルが有効な場合はランダム）
    const prevIndex = shuffle
      ? Math.floor(Math.random() * songs.length)
      : (currentIndex - 1 + songs.length) % songs.length;

    try {
      await playSong(songs[prevIndex]);
    } catch (error) {
      console.error("前の曲の再生エラー:", error);
    }
  }, [songs, currentSong, shuffle, songIndexMap, playSong]);

  /**
   * 再生を停止し、状態をリセットする
   */
  const stop = useCallback(async () => {
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
  ]);

  const updatePlaybackStatus = useCallback(async () => {
    if (sound) {
      try {
        const status = await sound.getStatusAsync();
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis || 0);
        }
      } catch (error) {
        console.error("Error updating playback status:", error);
      }
    }
  }, [sound]);

  // 定期的に再生位置を更新
  useEffect(() => {
    if (isPlaying && sound) {
      positionUpdateIntervalRef.current = setInterval(
        updatePlaybackStatus,
        1000
      );
    }
    return () => {
      if (positionUpdateIntervalRef.current) {
        clearInterval(positionUpdateIntervalRef.current);
      }
    };
  }, [isPlaying, sound, updatePlaybackStatus]);

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
