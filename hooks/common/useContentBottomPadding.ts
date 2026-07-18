import { LAYOUT } from "@/constants";
import { useAudioStore } from "@/hooks/stores/useAudioStore";
import { usePlayerStore } from "@/hooks/stores/usePlayerStore";

/**
 * スクロール画面の下部パディングを算出するフック。
 *
 * 画面下部にはタブバー（固定 80px）が常駐し、再生中はその上にミニプレイヤー（68px）が
 * 重なる。従来は各画面が magic number（100 / 120）で下部パディングを固定していたため、
 * ミニプレイヤーの有無や端末差で「余白過多」や「コンテンツがプレイヤーに隠れる」問題が
 * 起きていた。ここで実際のオーバーレイ高さ + 余白を一元的に返す。
 */
export function useContentBottomPadding(): number {
  const showPlayer = usePlayerStore((state) => state.showPlayer);
  const isMiniPlayerVisible = usePlayerStore(
    (state) => state.isMiniPlayerVisible,
  );
  const currentSong = useAudioStore((state) => state.currentSong);

  // PlayerContainer と同じ条件でミニプレイヤーの表示を判定する。
  const miniPlayerVisible = !!currentSong && !showPlayer && isMiniPlayerVisible;

  return (
    LAYOUT.tabBarHeight +
    (miniPlayerVisible ? LAYOUT.miniPlayerHeight : 0) +
    LAYOUT.contentGap
  );
}

export default useContentBottomPadding;
