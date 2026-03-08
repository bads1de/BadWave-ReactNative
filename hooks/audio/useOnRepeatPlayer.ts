import { useEffect, useRef } from "react";
import { useVideoPlayer, VideoSource } from "expo-video";
import Song from "@/types";
import { useOnRepeatStore } from "@/hooks/stores/useOnRepeatStore";

/**
 * OnRepeat Player 用の再生制御フック
 *
 * 曲に動画がある場合は動画を再生します。
 * プレビュー機能として、ストアで事前に計算された位置から再生を開始します。
 *
 * @param song 再生する曲
 * @param isVisible この曲が現在表示されているかどうか
 * @param isPreloading この曲を事前にロードするかどうか
 * @returns player インスタンスと hasVideo フラグ
 */
export const useOnRepeatPlayer = (
  song: Song,
  isVisible: boolean,
  isPreloading: boolean = false
) => {
  const hasVideo = !!song.video_path;
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  // ストアから事前に計算された開始位置（パーセンテージ）を取得
  const startPercentage = useOnRepeatStore(
    (state) => state.startPercentages[song.id]
  );
  
  const hasSeekedRef = useRef(false);

  // 動画プレイヤー (isVisible または isPreloading の場合にリソースを確保)
  const videoPlayerSource = hasVideo && (isVisible || isPreloading) ? song.video_path : null;
  const videoPlayerArr = useVideoPlayer(
    videoPlayerSource as VideoSource | null,
    (p) => {
      p.loop = true;
      p.muted = true; // 動画は常に無音
      if (!isVisibleRef.current) {
        p.pause();
      }
    },
  );
  // useVideoPlayer returns an array or object depending on version, but badwave project seems to use it as an object based on previous code.
  // Wait, line 26 in original code: const videoPlayer = useVideoPlayer(...)
  const videoPlayer = videoPlayerArr;

  // 音声用プレイヤー (isVisible または isPreloading の場合にリソースを確保)
  const audioPlayerSource = (isVisible || isPreloading) ? song.song_path : null;
  const audioPlayer = useVideoPlayer(
    audioPlayerSource as VideoSource | null,
    (p) => {
      p.loop = true;
      if (!isVisibleRef.current) {
        p.pause();
      }
    },
  );

  // プリフェッチ・シーク処理 (両方のプレイヤーを同期)
  useEffect(() => {
    // startPercentageがない（ストアが初期化されていない）場合は何もしない
    if (startPercentage === undefined) return;

    // ロードされたら指定の位置にシーク
    if ((isVisible || isPreloading) && audioPlayer && !hasSeekedRef.current) {
      const trySeek = () => {
        const duration = audioPlayer.duration;
        if (duration && duration > 0) {
          const seekPosition = duration * startPercentage;

          if (videoPlayer) {
            videoPlayer.currentTime = seekPosition;
          }
          audioPlayer.currentTime = seekPosition;
          hasSeekedRef.current = true;

          // 表示中の場合は再生開始
          if (isVisibleRef.current) {
            if (videoPlayer) videoPlayer.play();
            audioPlayer.play();
          }
          return true;
        }
        return false;
      };

      if (trySeek()) return;

      const interval = setInterval(() => {
        if (trySeek()) clearInterval(interval);
      }, 200);

      const timeout = setTimeout(() => clearInterval(interval), 10000);
      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isVisible, isPreloading, videoPlayer, audioPlayer, startPercentage]);

  // 再生・一時停止制御
  useEffect(() => {
    if (isVisible) {
      if (hasSeekedRef.current) {
        if (videoPlayer) videoPlayer.play();
        audioPlayer.play();
      }
    } else {
      if (videoPlayer) videoPlayer.pause();
      audioPlayer.pause();
    }
  }, [isVisible, videoPlayer, audioPlayer]);

  // 曲が変わったら再生位置の記憶をリセット
  const prevSongIdRef = useRef<string | null>(null);
  if (prevSongIdRef.current !== song.id) {
    hasSeekedRef.current = false;
    prevSongIdRef.current = song.id;
  }

  return {
    player: videoPlayer,
    audioPlayer,
    hasVideo,
  };
};
