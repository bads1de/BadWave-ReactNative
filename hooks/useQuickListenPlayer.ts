import { useEffect, useRef, useState } from "react";
import { useVideoPlayer, VideoSource } from "expo-video";
import Song from "@/types";

/**
 * Quick Listen 用の再生制御フック
 *
 * 曲に動画がある場合は動画を再生します。
 * プレビュー機能として、曲のランダムな位置から再生を開始します。
 *
 * @param song 再生する曲
 * @param isVisible この曲が現在表示されているかどうか
 * @returns player インスタンスと hasVideo フラグ
 */
export const useQuickListenPlayer = (song: Song, isVisible: boolean) => {
  const hasVideo = !!song.video_path;
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  // ランダム位置を一度だけ計算（曲が変わるまで固定）
  const randomStartRef = useRef<number | null>(null);
  const hasSeenkedRef = useRef(false);

  // 動画プレイヤー
  const player = useVideoPlayer(
    (song.video_path || song.song_path) as VideoSource,
    (p) => {
      p.loop = true;
      if (!isVisibleRef.current) {
        p.pause();
      }
    }
  );

  // ランダムな再生位置にシーク
  useEffect(() => {
    if (isVisible && player && !hasSeenkedRef.current) {
      // プレイヤーの準備ができたらランダム位置にシーク
      const seekToRandomPosition = () => {
        const duration = player.duration;
        if (duration && duration > 0) {
          // 曲の20%〜80%の間でランダムな位置を選択
          const minPosition = duration * 0.2;
          const maxPosition = duration * 0.8;
          const randomPosition =
            minPosition + Math.random() * (maxPosition - minPosition);

          if (randomStartRef.current === null) {
            randomStartRef.current = randomPosition;
          }

          player.currentTime = randomStartRef.current;
          hasSeenkedRef.current = true;
          player.play();
        }
      };

      // プレイヤーがロードされるまで少し待つ
      const timer = setTimeout(() => {
        seekToRandomPosition();
      }, 200);

      return () => clearTimeout(timer);
    }
  }, [isVisible, player]);

  // 再生制御
  useEffect(() => {
    if (isVisible) {
      // 既にシーク済みの場合のみ再生
      if (hasSeenkedRef.current) {
        player.play();
      }
    } else {
      player.pause();
    }
  }, [isVisible, player]);

  // 曲が変わったらリセット
  useEffect(() => {
    randomStartRef.current = null;
    hasSeenkedRef.current = false;
  }, [song.id]);

  return {
    player,
    hasVideo,
  };
};
