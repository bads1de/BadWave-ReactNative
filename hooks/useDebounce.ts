import { useDebounce as useDebounceLib } from "use-debounce";

/**
 * 値のデバウンス処理を行うカスタムフックです。
 * use-debounce ライブラリを使用して実装を統一しています。
 *
 * @template T - デバウンス対象の値の型。
 * @param {T} value - デバウンスする値。
 * @param {number} delay - デバウンスの遅延時間（ミリ秒）。
 * @returns {T} デバウンス処理された値。
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue] = useDebounceLib(value, delay);
  return debouncedValue;
}
