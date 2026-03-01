import { useNetworkStore } from "@/hooks/stores/useNetworkStore";

/**
 * ネットワーク接続状態を取得するフック（後方互換ラッパー）
 *
 * 以前は各コンポーネントが個別に NetInfo.addEventListener を登録していたが、
 * 現在は useNetworkStore（Zustand）からサブスクライブするだけです。
 * NetInfo のリスナーはアプリ全体で1つだけ存在します（_layout.tsx で初期化）。
 */
export function useNetworkStatus() {
  const isOnline = useNetworkStore((state) => state.isOnline);
  return { isOnline };
}

export default useNetworkStatus;
