import { useVideoPlayer, VideoSource } from "expo-video";
import { useEffect, useRef } from "react";

/**
 * スポットライト専用のビデオプレイヤーを管理するためのカスタムフック。
 * スポットライトの表示状態に基づいてビデオの再生を制御し、ループ再生を有効にします。
 *
 * @param source 再生するビデオソース。
 * @param isVisible スポットライトが現在表示されているかどうかを示すブーリアン値。
 * @returns useVideoPlayer からのビデオプレイヤーインスタンス。
 */
export const useSpotlightPlayer = (source: VideoSource, isVisible: boolean) => {
  // isVisibleの現在値をrefで保持（setup関数内からアクセスするため）
  const isVisibleRef = useRef(isVisible);
  isVisibleRef.current = isVisible;

  // setup関数でプレイヤーの初期設定を行う
  const player = useVideoPlayer(source, (p) => {
    p.loop = true;
    // 初期状態では再生しない（isVisibleがtrueの場合のみ再生）
    if (!isVisibleRef.current) {
      p.pause();
    }
  });

  useEffect(() => {
    // スポットライトの表示状態に基づいてビデオを再生または一時停止します。
    if (isVisible) {
      player.play();
    } else {
      player.pause();
    }
  }, [isVisible, player]);

  return player;
};

