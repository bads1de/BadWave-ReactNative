import { useEffect, useRef } from "react";
import { useVideoPlayer, VideoSource } from "expo-video";
import Song from "@/types";

/**
 * OnRepeat Player 用の再生制御フック
 *
 * 曲に動画がある場合は動画を再生します。
 * プレビュー機能として、曲のランダムな位置から再生を開始します。
 *
 * @param song 再生する曲
 * @param isVisible この曲が現在表示されているかどうか
 * @returns player インスタンスと hasVideo フラグ
 */
export const useOnRepeatPlayer = (song: Song, isVisible: boolean) => {
  const hasVideo = !!song.video_path;
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  // ランダム位置を一度だけ計算（曲が変わるまで固定）
  const randomStartRef = useRef<number | null>(null);
  const hasSeenkedRef = useRef(false);

  // 動画プレイヤー (動画パスがあれば動画をセット、非表示時はリソースを確保しない)
  const videoPlayerSource = hasVideo && isVisible ? song.video_path : null;
  const videoPlayer = useVideoPlayer(
    videoPlayerSource as VideoSource | null,
    (p) => {
      p.loop = true;
      p.muted = true; // 動画は常に無音
      if (!isVisibleRef.current) {
        p.pause();
      }
    },
  );

  // 音声用プレイヤー (必ず曲のパスをセット、非表示時はリソースを確保しない)
  const audioPlayerSource = isVisible ? song.song_path : null;
  const audioPlayer = useVideoPlayer(
    audioPlayerSource as VideoSource | null,
    (p) => {
      p.loop = true;
      if (!isVisibleRef.current) {
        p.pause();
      }
    },
  );

  // ランダムな再生位置にシーク (両方のプレイヤーを同期)
  useEffect(() => {
    // trySeek内でvideoPlayerとaudioPlayerを使うが、videoPlayerはnullになる可能性があるのでaudioPlayerを必須条件にする
    if (isVisible && audioPlayer && !hasSeenkedRef.current) {
      // プレイヤーの準備ができたらランダム位置にシーク
      const trySeek = () => {
        // メインの音源の長さを基準にする
        const duration = audioPlayer.duration;
        if (duration && duration > 0) {
          // 曲の20%〜80%の間でランダムな位置を選択
          const minPosition = duration * 0.2;
          const maxPosition = duration * 0.8;
          const randomPosition =
            minPosition + Math.random() * (maxPosition - minPosition);

          if (randomStartRef.current === null) {
            randomStartRef.current = randomPosition;
          }

          if (videoPlayer) {
            videoPlayer.currentTime = randomStartRef.current;
          }
          audioPlayer.currentTime = randomStartRef.current;
          hasSeenkedRef.current = true;

          if (videoPlayer) {
            videoPlayer.play();
          }
          audioPlayer.play();
          return true;
        }
        return false;
      };

      // 即時実行を試みる
      if (trySeek()) return;

      // ロード待ちポーリング (200ms間隔)
      const interval = setInterval(() => {
        if (trySeek()) {
          clearInterval(interval);
        }
      }, 200);

      // 10秒でタイムアウト
      const timeout = setTimeout(() => {
        clearInterval(interval);
      }, 10000);

      return () => {
        clearInterval(interval);
        clearTimeout(timeout);
      };
    }
  }, [isVisible, videoPlayer, audioPlayer]);

  // 再生制御 (両方のプレイヤーを連動)
  useEffect(() => {
    if (isVisible) {
      // 既にシーク済みの場合のみ再生
      if (hasSeenkedRef.current) {
        if (videoPlayer) {
          videoPlayer.play();
        }
        audioPlayer.play();
      }
    } else {
      if (videoPlayer) {
        videoPlayer.pause();
      }
      audioPlayer.pause();
    }
  }, [isVisible, videoPlayer, audioPlayer]);

  // 曲が変わったらリセット
  useEffect(() => {
    randomStartRef.current = null;
    hasSeenkedRef.current = false;
  }, [song.id]);

  return {
    player: videoPlayer, // UIの<VideoView>に渡すのは動画用のプレイヤー
    audioPlayer, // 内部で音を鳴らす用のプレイヤー
    hasVideo,
  };
};
