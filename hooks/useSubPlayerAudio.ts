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
 *
 * このフックはサブプレイヤーコンポーネント専用の音声再生機能を提供します。
 * メインプレイヤーとは独立して動作し、expo-avを直接使用して実装しています。
 * 主な機能:
 * - 曲のプレビュー再生（ランダムな位置から指定秒数）
 * - 自動再生と手動再生の切り替え
 * - スワイプによる曲の切り替え
 * - 音声の重複再生を防止するための厳格な制御
 * - 無限ループ再生（最後の曲の後は最初に戻る）
 *
 * @returns {Object} 再生状態と制御関数を含むオブジェクト
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
  const [isPlaying, setIsPlaying] = useState(false); // 再生中かどうか
  const [currentPosition, setCurrentPosition] = useState(0); // 現在の再生位置（ミリ秒）
  const [duration, setDuration] = useState(0); // 曲の総再生時間（ミリ秒）
  const [randomStartPosition, setRandomStartPosition] = useState(0); // ランダム開始位置（ミリ秒）
  const [isLoading, setIsLoading] = useState(false); // 読み込み中かどうか

  // 参照オブジェクト（コンポーネントのライフサイクル間で保持される値）
  const soundRef = useRef<Audio.Sound | null>(null); // Audio.Sound インスタンス
  const timerRef = useRef<NodeJS.Timeout | null>(null); // 自動再生用タイマー
  const positionUpdateRef = useRef<NodeJS.Timeout | null>(null); // 位置更新用タイマー
  const isMounted = useRef(true); // コンポーネントがマウントされているか
  const isChangingSong = useRef(false); // 曲の切り替え中かどうか
  const loadingLock = useRef(false); // 読み込みロック（同時読み込み防止）

  // 現在の曲
  const currentSong = songs[currentSongIndex];

  /**
   * すべてのタイマーをクリアする関数
   * 自動再生用タイマーと位置更新用タイマーを停止し、参照をクリアする
   */
  const clearAllTimers = useCallback(() => {
    // 自動再生用タイマーをクリア
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    // 位置更新用タイマーをクリア
    if (positionUpdateRef.current) {
      clearInterval(positionUpdateRef.current);
      positionUpdateRef.current = null;
    }
  }, []);

  /**
   * 音声を完全に停止して解放する関数
   * 再生中の音声を停止し、メモリからアンロードしてリソースを解放する
   * @returns {Promise<void>} 処理の完了を表すPromise
   */
  const stopAndUnloadSound = useCallback(async () => {
    // 再生状態をリセット
    setIsPlaying(false);
    isChangingSong.current = true;
    loadingLock.current = true;

    // すべてのタイマーをクリア
    clearAllTimers();

    try {
      // 既存のサウンドオブジェクトがあれば停止してアンロード
      if (soundRef.current) {
        try {
          // 再生を停止（エラーを無視して続行）
          await soundRef.current.pauseAsync().catch(() => {});
          await soundRef.current.stopAsync().catch(() => {});

          // メモリからアンロードしてリソースを解放
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
      // 少し待ってから状態ロックを解除
      // 即時に解除するとレースコンディションが発生する可能性がある
      setTimeout(() => {
        isChangingSong.current = false;
        loadingLock.current = false;
      }, 300);
    }
  }, [clearAllTimers]);

  /**
   * 再生位置更新タイマーを開始する関数
   * 定期的に現在の再生位置を取得して状態を更新する
   */
  const startPositionUpdateTimer = useCallback(() => {
    // 既存のタイマーがあればクリア
    if (positionUpdateRef.current) {
      clearInterval(positionUpdateRef.current);
      positionUpdateRef.current = null;
    }

    // 新しいタイマーを開始
    positionUpdateRef.current = setInterval(async () => {
      // 有効な状態の場合のみ処理を実行
      if (soundRef.current && isMounted.current && !isChangingSong.current) {
        try {
          // 現在の再生状態を取得
          const status = await soundRef.current.getStatusAsync();

          // 音声が読み込まれていれば位置を更新
          if (status.isLoaded) {
            setCurrentPosition(status.positionMillis);
          }
        } catch (error) {
          console.error("Error getting position:", error);
        }
      }
    }, 200); // 200msごとに更新（パフォーマンスを考慮した間隔）
  }, []);

  /**
   * 次の曲を再生する関数（無限ループ対応）
   * 現在の曲を停止し、次の曲に移動する
   * 最後の曲の場合は最初の曲に戻る
   */
  const playNextSong = useCallback(() => {
    // 無効な状態の場合は処理を中止
    if (!isMounted.current || isChangingSong.current || loadingLock.current) {
      return;
    }

    // 現在の曲を停止して解放
    stopAndUnloadSound().then(() => {
      // 少し待ってから次の曲に移動（リソース解放の時間を確保）
      setTimeout(() => {
        if (isMounted.current) {
          // 曲がない場合は何もしない
          if (songs.length === 0) return;

          // 次の曲のインデックスを計算
          // 曲が1曲しかない場合は同じ曲を再度再生
          // 最後の曲の場合は最初に戻る（無限ループ）
          const nextIndex =
            songs.length === 1 ? 0 : (currentSongIndex + 1) % songs.length;

          // ストアの曲インデックスを更新
          setCurrentSongIndex(nextIndex);
        }
      }, 300);
    });
  }, [songs.length, currentSongIndex, setCurrentSongIndex, stopAndUnloadSound]);

  /**
   * 再生状態の更新ハンドラ
   * expo-avからのコールバックで、再生状態の変化を処理する
   * @param {AVPlaybackStatus} status - 音声の再生状態
   */
  const onPlaybackStatusUpdate = useCallback(
    (status: AVPlaybackStatus) => {
      // 無効な状態の場合は処理を中止
      if (!status.isLoaded || !isMounted.current || isChangingSong.current) {
        return;
      }

      // 再生状態を更新
      setIsPlaying(status.isPlaying);

      // 曲が終了した場合の処理
      if (status.didJustFinish) {
        // 確実に次の曲へ移動
        playNextSong();
      }
    },
    [playNextSong]
  );

  /**
   * 曲を読み込み、再生する関数
   * 指定された曲をメモリに読み込み、ランダムな位置から再生を開始する
   * @param {Song} song - 再生する曲のデータ
   * @returns {Promise<void>} 処理の完了を表すPromise
   */
  const loadAndPlaySong = useCallback(
    async (song: Song) => {
      // 無効な状態や入力の場合は処理を中止
      if (
        !song ||
        !song.song_path ||
        !isMounted.current ||
        isChangingSong.current ||
        loadingLock.current
      ) {
        return;
      }

      // ロック状態にして複数の読み込みを防止
      loadingLock.current = true;
      setIsLoading(true);

      try {
        // 既存のサウンドがあれば確実に解放
        if (soundRef.current) {
          await soundRef.current.unloadAsync().catch(() => {});
          soundRef.current = null;
        }

        // 新しいサウンドオブジェクトを作成
        const { sound } = await Audio.Sound.createAsync(
          { uri: song.song_path },
          { shouldPlay: false }, // 初期状態は再生停止
          onPlaybackStatusUpdate // 状態変化時のコールバック
        );

        // 参照を保存
        soundRef.current = sound;

        // サウンドの総再生時間を取得
        const status = await sound.getStatusAsync();
        const totalDuration = status.isLoaded ? status.durationMillis || 0 : 0;
        setDuration(totalDuration);

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

        // 位置更新タイマーを開始
        startPositionUpdateTimer();

        // 自動再生モードが有効な場合、指定時間後に次の曲に移動するタイマーを設定
        if (autoPlay && previewDuration > 0) {
          timerRef.current = setTimeout(() => {
            if (isMounted.current && !isChangingSong.current) {
              playNextSong();
            }
          }, previewDuration * 1000); // 秒をミリ秒に変換
        }
      } catch (error) {
        console.error("Error loading sound:", error, "Song:", song.title);
      } finally {
        // 読み込み状態をリセット
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

  /**
   * 前の曲を再生する関数（無限ループ対応）
   * 現在の曲を停止し、前の曲に移動する
   * 最初の曲の場合は最後の曲に移動する
   */
  const playPrevSong = useCallback(() => {
    // 無効な状態の場合は処理を中止
    if (!isMounted.current || isChangingSong.current || loadingLock.current) {
      return;
    }

    // 現在の曲を停止して解放
    stopAndUnloadSound().then(() => {
      // 少し待ってから前の曲に移動（リソース解放の時間を確保）
      setTimeout(() => {
        if (isMounted.current) {
          // 曲がない場合は何もしない
          if (songs.length === 0) return;

          // 前の曲のインデックスを計算
          // 曲が1曲しかない場合は同じ曲を再度再生
          // 最初の曲の場合は最後に移動（無限ループ）
          const prevIndex =
            songs.length === 1
              ? 0
              : (currentSongIndex - 1 + songs.length) % songs.length;

          // ストアの曲インデックスを更新
          setCurrentSongIndex(prevIndex);
        }
      }, 300);
    });
  }, [songs.length, currentSongIndex, setCurrentSongIndex, stopAndUnloadSound]);

  /**
   * 再生/一時停止を切り替える関数
   * 現在の再生状態に応じて再生または一時停止を切り替える
   * @returns {Promise<void>} 処理の完了を表すPromise
   */
  const togglePlayPause = useCallback(async () => {
    // 無効な状態の場合は処理を中止
    if (
      !soundRef.current ||
      isChangingSong.current ||
      isLoading ||
      loadingLock.current
    ) {
      return;
    }

    try {
      // 現在再生中なら一時停止する
      if (isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);

        // 自動再生タイマーを一時停止
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      }
      // 現在停止中なら再生を開始する
      else {
        await soundRef.current.playAsync();
        setIsPlaying(true);

        // 自動再生モードが有効な場合、残り時間を計算してタイマーを再設定
        if (autoPlay && previewDuration > 0) {
          const status = await soundRef.current.getStatusAsync();

          if (status.isLoaded) {
            // 残りの再生時間を計算（プレビュー時間 - 経過時間）
            const remainingTime =
              previewDuration * 1000 -
              (status.positionMillis - randomStartPosition);

            // 残り時間があればタイマーを設定
            if (remainingTime > 0) {
              timerRef.current = setTimeout(() => {
                if (isMounted.current && !isChangingSong.current) {
                  playNextSong();
                }
              }, remainingTime);
            }
            // 残り時間がない場合はすぐに次の曲に移動
            else {
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

  /**
   * 指定位置にシークする関数
   * 再生位置を指定の時間（ミリ秒）に移動する
   * @param {number} position - シークする位置（ミリ秒）
   * @returns {Promise<void>} 処理の完了を表すPromise
   */
  const seekTo = useCallback(
    async (position: number) => {
      // 無効な状態の場合は処理を中止
      if (
        !soundRef.current ||
        isChangingSong.current ||
        isLoading ||
        loadingLock.current
      ) {
        return;
      }

      try {
        // 指定位置にシーク
        await soundRef.current.setPositionAsync(position);
        setCurrentPosition(position);

        // 再生中で自動再生モードが有効な場合、タイマーを再設定
        if (isPlaying && autoPlay && previewDuration > 0) {
          // 既存のタイマーがあればクリア
          if (timerRef.current) {
            clearTimeout(timerRef.current);
          }

          // 残りの再生時間を計算（プレビュー時間 - 経過時間）
          const remainingTime =
            previewDuration * 1000 - (position - randomStartPosition);

          // 残り時間があればタイマーを設定
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

  /**
   * 初期化処理を行うフック
   * コンポーネントのマウント時に実行される
   */
  useEffect(() => {
    // Audio モードを設定（他の音声との共存方法を定義）
    Audio.setAudioModeAsync({
      playsInSilentModeIOS: true, // iOSのサイレントモードでも再生する
      staysActiveInBackground: true, // バックグラウンドでも再生を継続する
      interruptionModeIOS: InterruptionModeIOS.DoNotMix, // iOSで他の音声と混合しない
      interruptionModeAndroid: InterruptionModeAndroid.DoNotMix, // Androidで他の音声と混合しない
      shouldDuckAndroid: true, // Androidで他の音声が再生されたときは音量を下げる
    }).catch((error) => {
      console.error("Error setting audio mode:", error);
    });

    // コンポーネントの状態管理用の参照を初期化
    isMounted.current = true; // マウント状態をアクティブに設定
    isChangingSong.current = false; // 曲の切り替え状態をリセット
    loadingLock.current = false; // 読み込みロックを解除

    // クリーンアップ処理（コンポーネントのアンマウント時に実行）
    return () => {
      isMounted.current = false; // マウント状態を非アクティブに設定
      stopAndUnloadSound(); // 音声を停止してリソースを解放
    };
  }, [stopAndUnloadSound]);

  /**
   * 曲が変わったときに再読み込みを行うフック
   * currentSongIndexが変更されたときに実行される
   */
  useEffect(() => {
    // 有効な状態の場合のみ処理を実行
    if (currentSong && isMounted.current && currentSongIndex >= 0) {
      // 現在の音声を確実に停止して解放
      stopAndUnloadSound()
        .then(() => {
          // 少し待ってから新しい曲を読み込む（リソース解放の時間を確保）
          setTimeout(() => {
            if (isMounted.current) {
              // 新しい曲を読み込んで再生開始
              loadAndPlaySong(currentSong);
            }
          }, 300); // タイミングを少し長めに設定して安定性を確保
        })
        .catch((error) => {
          // エラーが発生しても再度読み込みを試行
          setTimeout(() => {
            if (isMounted.current) {
              loadAndPlaySong(currentSong);
            }
          }, 300);
        });
    }
  }, [currentSongIndex, loadAndPlaySong, currentSong, stopAndUnloadSound]);

  /**
   * フックの返り値
   * 再生状態と制御関数を含むオブジェクト
   */
  return {
    // 再生状態
    isPlaying, // 再生中かどうか
    currentPosition, // 現在の再生位置（ミリ秒）
    duration, // 曲の総再生時間（ミリ秒）
    randomStartPosition, // ランダムな開始位置（ミリ秒）
    isLoading, // 読み込み中かどうか

    // 制御関数
    playNextSong, // 次の曲を再生する関数
    playPrevSong, // 前の曲を再生する関数
    togglePlayPause, // 再生/一時停止を切り替える関数
    seekTo, // 指定位置にシークする関数
    stopAndUnloadCurrentSound: stopAndUnloadSound, // 音声を停止して解放する関数
  };
}
