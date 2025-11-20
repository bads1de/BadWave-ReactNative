import { useState, useEffect } from "react";

/**
 * 値のデバウンス処理を行うカスタムフックです。
 * 指定された遅延時間の間、値の変更を遅延させます。
 * 検索入力など、頻繁に更新される値の処理を効率化するために使用します。
 *
 * @template T - デバウンス対象の値の型。
 * @param {T} value - デバウンスする値。
 * @param {number} delay - デバウンスの遅延時間（ミリ秒）。
 * @returns {T} デバウンス処理された値。
 *
 * @example
 * ```tsx
 * const [searchTerm, setSearchTerm] = useState('');
 * const debouncedSearchTerm = useDebounce(searchTerm, 500);
 *
 * useEffect(() => {
 *   // debouncedSearchTermが変更されたときにAPIを呼び出す
 *   if (debouncedSearchTerm) {
 *     searchAPI(debouncedSearchTerm);
 *   }
 * }, [debouncedSearchTerm]);
 *
 * return (
 *   <TextInput
 *     onChangeText={setSearchTerm}
 *     value={searchTerm}
 *   />
 * );
 * ```
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
