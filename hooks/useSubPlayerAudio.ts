import { useCallback, useEffect, useRef, useState } from "react";
import {
  Audio,
  InterruptionModeIOS,
  InterruptionModeAndroid,
  AVPlaybackStatus,
} from "expo-av";
import { useSubPlayerStore } from "@/hooks/useSubPlayerStore";
import Song from "@/types";

/**
 * SubPlayer用の独立したオーディオ再生管理フック
 * TrackPlayerを使わず、expo-avを直接使用して実装
 * 音声の重複再生を防ぐための厳格な制御を実装
 */
export function useSubPlayerAudio() {
  // Zustand ストアから状態を取得
  const {
    songs,
    currentSongIndex,
    previewDuration,
    autoPlay,
    setCurrentSongIndex,
  } = useSubPlayerStore();

  // 再生状態の管理
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [randomStartPosition, setRandomStartPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Audio Sound オブジェクトの参照
  const soundRef = useRef<Audio.Sound | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const positionUpdateRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);
  const isChangingSong = useRef(false);
  const loadingLock = useRef(false);

  // 現在の曲
  const currentSong = songs[currentSongIndex];

  // すべてのタイマーをクリア
  const clearAllTimers = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (positionUpdateRef.current) {
      clearInterval(positionUpdateRef.current);
      positionUpdateRef.current = null;
    }
  }, []);

  // 音声を完全に停止して解放する
  const stopAndUnloadSound = useCallback(async () => {
    // 状態をリセット
    setIsPlaying(false);
    isChangingSong.current = true;
    loadingLock.current = true;

    // すべてのタイマーをクリア
    clearAllTimers();

    try {
      // 既存のサウンドを停止してアンロード
      if (soundRef.current) {
        try {
          // 再生を停止
          await soundRef.current.pauseAsync().catch(() => {});
          await soundRef.current.stopAsync().catch(() => {});

          // アンロードしてメモリを解放
          await soundRef.current.unloadAsync().catch(() => {});
        } catch (e) {
          console.error("Error during sound cleanup:", e);
        } finally {
          // 参照をクリア
          soundRef.current = null;
        }
      }
    } catch (error) {
      console.error("Error in stopAndUnloadSound:", error);
    } finally {
      // 少し待ってから状態をリセット
      setTimeout(() => {
        isChangingSong.current = false;
        loadingLock.current = false;
      }, 300);
    }
  }, [clearAllTimers]);

  // 位置更新タイマーを開始
  const startPositionUpdateTimer = useCallback(() => {
    if (positionUpdateRef.current) {
      clearInterval(positionUpdateRef.current);
      positionUpdateRef.current = null;
    }

    positionUpdateRef.current = setInterval(async () => {
      if (soundRef.current && isMounted.current && !isChangingSong.current) {
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            setCurrentPosition(status.positionMillis);
          }
        } catch (error) {
          console.error("Error getting position:", error);
        }
      }
    }, 200); // 200msごとに更新（負荷軽減のため間隔を広げる）
  }, []);

  // 次の曲を再生（無限ループ）
  const playNextSong = useCallback(() => {
    // マウント状態のみチェックし、曲数はチェックしない
    if (!isMounted.current || isChangingSong.current || loadingLock.current)
      return;

    // 曲が1曲しかない場合でも、同じ曲を再度再生する
    stopAndUnloadSound().then(() => {
      // 少し待ってから次の曲に移動
      setTimeout(() => {
        if (isMounted.current) {
          // 曲がない場合は何もしない
          if (songs.length === 0) return;

          // 曲が1曲しかない場合でも、同じ曲を再度再生する
          const nextIndex =
            songs.length === 1 ? 0 : (currentSongIndex + 1) % songs.length;
          console.log(
            `Moving to next song: ${currentSongIndex} -> ${nextIndex}`
          );
          setCurrentSongIndex(nextIndex);
        }
      }, 300);
    });
  }, [songs.length, currentSongIndex, setCurrentSongIndex, stopAndUnloadSound]);

  // 再生状態の更新ハンドラ
  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded || !isMounted.current || isChangingSong.current)
        return;

      setIsPlaying(status.isPlaying);

      if (status.didJustFinish) {
        console.log("Song finished, moving to next song");
        // 曲が終了したら確実に次の曲へ移動
        playNextSong();
      }
    },
    [playNextSong]
  );

  // 曲の読み込みと再生
  const loadAndPlaySong = useCallback(
    async (song: Song) => {
      if (
        !song ||
        !song.song_path ||
        !isMounted.current ||
        isChangingSong.current ||
        loadingLock.current
      ) {
        console.log(
          "Cannot load song, invalid state or missing path",
          song?.title
        );
        return;
      }

      // ロック状態にして複数の読み込みを防止
      loadingLock.current = true;
      setIsLoading(true);
      console.log(
        "Starting to load song:",
        song.title,
        "Path:",
        song.song_path
      );

      try {
        // 既存のサウンドを確実に解放
        if (soundRef.current) {
          await soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }

        // 新しいサウンドを作成
        const { sound } = await Audio.Sound.createAsync(
          { uri: song.song_path },
          { shouldPlay: false },
          onPlaybackStatusUpdate
        );

        // 参照を保存
        soundRef.current = sound;
        console.log("Successfully created sound object for:", song.title);

        // サウンドの総再生時間を取得
        const status = await sound.getStatusAsync();
        const totalDuration = status.isLoaded ? status.durationMillis || 0 : 0;
        setDuration(totalDuration);
        console.log("Song duration:", totalDuration);

        // ランダムな開始位置を計算（曲の長さの20%〜80%の範囲）
        const randomPosition = Math.floor(
          Math.random() * (totalDuration * 0.6) + totalDuration * 0.2
        );
        setRandomStartPosition(randomPosition);

        // 指定位置にシーク
        await sound.setPositionAsync(randomPosition);
        setCurrentPosition(randomPosition);

        // 再生開始
        await sound.playAsync();
        setIsPlaying(true);
        console.log("Started playing song:", song.title);

        // 位置更新タイマーを開始
        startPositionUpdateTimer();

        // 自動再生タイマーをセット
        if (autoPlay && previewDuration > 0) {
          timerRef.current = setTimeout(() => {
            if (isMounted.current && !isChangingSong.current) {
              playNextSong();
            }
          }, previewDuration * 1000);
        }
      } catch (error) {
        console.error("Error loading sound:", error, "Song:", song.title);
      } finally {
        setIsLoading(false);
        loadingLock.current = false;
      }
    },
    [
      previewDuration,
      autoPlay,
      onPlaybackStatusUpdate,
      startPositionUpdateTimer,
      playNextSong,
    ]
  );

  // 前の曲を再生（無限ループ）
  const playPrevSong = useCallback(() => {
    // マウント状態のみチェックし、曲数はチェックしない
    if (!isMounted.current || isChangingSong.current || loadingLock.current)
      return;

    // 曲が1曲しかない場合でも、同じ曲を再度再生する
    stopAndUnloadSound().then(() => {
      // 少し待ってから前の曲に移動
      setTimeout(() => {
        if (isMounted.current) {
          // 曲がない場合は何もしない
          if (songs.length === 0) return;

          // 曲が1曲しかない場合でも、同じ曲を再度再生する
          const prevIndex =
            songs.length === 1
              ? 0
              : (currentSongIndex - 1 + songs.length) % songs.length;
          console.log(
            `Moving to previous song: ${currentSongIndex} -> ${prevIndex}`
          );
          setCurrentSongIndex(prevIndex);
        }
      }, 300);
    });
  }, [songs.length, currentSongIndex, setCurrentSongIndex, stopAndUnloadSound]);

  // 再生/一時停止の切り替え
  const togglePlayPause = useCallback(async () => {
    if (
      !soundRef.current ||
      isChangingSong.current ||
      isLoading ||
      loadingLock.current
    )
      return;

    try {
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);

        // タイマーを一時停止
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);

        // 自動再生タイマーを再設定
        if (autoPlay && previewDuration > 0) {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
            const remainingTime =
              previewDuration * 1000 -
              (status.positionMillis - randomStartPosition);

            if (remainingTime > 0) {
              timerRef.current = setTimeout(() => {
                if (isMounted.current && !isChangingSong.current) {
                  playNextSong();
                }
              }, remainingTime);
            } else {
              playNextSong();
            }
          }
        }
      }
    } catch (error) {
      console.error("Error toggling play/pause:", error);
    }
  }, [
    isPlaying,
    autoPlay,
    previewDuration,
    randomStartPosition,
    playNextSong,
    isLoading,
  ]);

  // シーク
  const seekTo = useCallback(
    async (position: number) => {
      if (
        !soundRef.current ||
        isChangingSong.current ||
        isLoading ||
        loadingLock.current
      )
        return;

      try {
        await soundRef.current.setPositionAsync(position);
        setCurrentPosition(position);

        // タイマーを再設定
        if (isPlaying && autoPlay && previewDuration > 0) {
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }

          const remainingTime =
            previewDuration * 1000 - (position - randomStartPosition);
          if (remainingTime > 0) {
            timerRef.current = setTimeout(() => {
              if (isMounted.current && !isChangingSong.current) {
                playNextSong();
              }
            }, remainingTime);
          }
        }
      } catch (error) {
        console.error("Error seeking:", error);
      }
    },
    [
      isPlaying,
      autoPlay,
      previewDuration,
      randomStartPosition,
      playNextSong,
      isLoading,
    ]
  );

  // 初期化
  useEffect(() => {
    // Audio モードを設定
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      interruptionModeIOS: InterruptionModeIOS.DoNotMix,
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
      shouldDuckAndroid: true,
    }).catch((error) => {
      console.error("Error setting audio mode:", error);
    });

    // コンポーネントのマウント状態を追跡
    isMounted.current = true;
    isChangingSong.current = false;
    loadingLock.current = false;

    // クリーンアップ
    return () => {
      isMounted.current = false;
      stopAndUnloadSound();
    };
  }, [stopAndUnloadSound]);

  // 曲が変わったときに再読み込み
  useEffect(() => {
    // 曲が変わったときに必ず処理を実行
    if (currentSong && isMounted.current && currentSongIndex >= 0) {
      console.log(
        "Song index changed to:",
        currentSongIndex,
        "Song:",
        currentSong.title
      );

      // 現在の音声を確実に停止
      stopAndUnloadSound()
        .then(() => {
          // 少し待ってから新しい曲を読み込む
          setTimeout(() => {
            if (isMounted.current) {
              console.log("Loading new song:", currentSong.title);
              loadAndPlaySong(currentSong);
            }
          }, 300); // タイミングを少し長めに設定
        })
        .catch((error) => {
          setTimeout(() => {
            if (isMounted.current) {
              loadAndPlaySong(currentSong);
            }
          }, 300);
        });
    }
  }, [currentSongIndex, loadAndPlaySong, currentSong, stopAndUnloadSound]);

  return {
    isPlaying,
    currentPosition,
    duration,
    randomStartPosition,
    isLoading,
    playNextSong,
    playPrevSong,
    togglePlayPause,
    seekTo,
    stopAndUnloadCurrentSound: stopAndUnloadSound,
  };
}
