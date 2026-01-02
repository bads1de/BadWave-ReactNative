import { useCallback, useEffect, useRef, useState } from "react";
import { Audio, InterruptionModeIOS, InterruptionModeAndroid } from "expo-av";
import { useSubPlayerStore } from "@/hooks/stores/useSubPlayerStore";

export function useSubPlayerAudio() {
  const songs = useSubPlayerStore((state) => state.songs);
  const currentSongIndex = useSubPlayerStore((state) => state.currentSongIndex);
  const previewDuration = useSubPlayerStore((state) => state.previewDuration);
  const autoPlay = useSubPlayerStore((state) => state.autoPlay);
  const showSubPlayer = useSubPlayerStore((state) => state.showSubPlayer);
  const setCurrentSongIndex = useSubPlayerStore(
    (state) => state.setCurrentSongIndex
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [randomStartPosition, setRandomStartPosition] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const currentSong = songs[currentSongIndex];

  // 次の曲へ移動
  const playNextSong = useCallback(() => {
    if (songs.length === 0) return;
    setCurrentSongIndex((currentSongIndex + 1) % songs.length);
  }, [songs.length, currentSongIndex, setCurrentSongIndex]);

  // 前の曲へ移動
  const playPrevSong = useCallback(() => {
    if (songs.length === 0) return;
    setCurrentSongIndex((currentSongIndex - 1 + songs.length) % songs.length);
  }, [songs.length, currentSongIndex, setCurrentSongIndex]);

  // ランダム開始位置を決定 (20%〜80%)
  const calculateRandomStartPos = (durationMillis: number): number => {
    return Math.floor(
      Math.random() * (durationMillis * 0.6) + durationMillis * 0.2
    );
  };

  // 再生ロジック: currentSong または表示状態が変わるたびに実行
  useEffect(() => {
    // 表示されていない場合は何もしない（既に再生中ならクリーンアップで止まる）
    if (!currentSong || !showSubPlayer) return;

    let soundInstance: Audio.Sound | null = null;
    let isCancelled = false;

    async function loadAndPlay() {
      setIsLoading(true);
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          interruptionModeIOS: InterruptionModeIOS.DoNotMix,
          interruptionModeAndroid: InterruptionModeAndroid.DoNotMix,
          shouldDuckAndroid: true,
        });

        const { sound, status } = await Audio.Sound.createAsync(
          { uri: currentSong.song_path },
          { shouldPlay: false, progressUpdateIntervalMillis: 200 }
        );

        if (isCancelled) {
          await sound.unloadAsync();
          return;
        }

        soundInstance = sound;
        soundRef.current = sound;

        if (status.isLoaded) {
          const totalDuration = status.durationMillis || 0;
          const startPos = calculateRandomStartPos(totalDuration);

          setDuration(totalDuration);
          setRandomStartPosition(startPos);
          setCurrentPosition(startPos);

          sound.setOnPlaybackStatusUpdate((playbackStatus) => {
            if (!playbackStatus.isLoaded || isCancelled) return;

            setIsPlaying(playbackStatus.isPlaying);
            setCurrentPosition(playbackStatus.positionMillis);

            // 終了判定
            const isFinished = playbackStatus.didJustFinish;
            // プレビュー再生終了判定
            const isPreviewOver =
              autoPlay &&
              previewDuration > 0 &&
              playbackStatus.isPlaying &&
              playbackStatus.positionMillis >=
                startPos + previewDuration * 1000;

            if (isFinished || isPreviewOver) {
              // 重複発火を防ぐためコールバックを解除して次へ
              sound.setOnPlaybackStatusUpdate(null);
              playNextSong();
            }
          });

          await sound.setPositionAsync(startPos);
          await sound.playAsync();
        }
      } catch (error) {
        console.error("Error loading sub player sound:", error);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }

    loadAndPlay();

    // クリーンアップ: 次の曲のロード前やページ遷移時に実行
    return () => {
      isCancelled = true;
      setIsPlaying(false);
      if (soundInstance) {
        soundInstance.unloadAsync().catch(() => {});
      }
      soundRef.current = null;
    };
  }, [currentSong, showSubPlayer, autoPlay, previewDuration, playNextSong]);

  // 現在の音声を停止してアンロードする（外部からの強制停止用）
  const stopAndUnloadCurrentSound = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.unloadAsync();
      } catch (error) {
        // すでにアンロードされている場合などは無視
      }
      soundRef.current = null;
    }
  }, []);

  return {
    isPlaying,
    currentPosition,
    duration,
    randomStartPosition,
    isLoading,
    playNextSong,
    playPrevSong,
    stopAndUnloadCurrentSound,
  };
}
