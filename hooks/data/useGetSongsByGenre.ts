import { useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import getSongsByGenre from "@/actions/song/getSongsByGenre";

/**
 * ジャンル別の曲を取得するカスタムフック
 * @param {string | string[]} genre 検索対象のジャンル（単一または複数）
 * @param {boolean} enabled クエリを有効にするか
 * @returns {UseQueryResult<Song[], Error>} ジャンル別の曲のクエリ結果
 */
export function useGetSongsByGenre(
  genre: string | string[],
  enabled: boolean = true
) {
  return useQuery({
    queryKey: [CACHED_QUERIES.songsByGenre, genre],
    queryFn: () => getSongsByGenre(genre),
    enabled: !!genre && enabled,
  });
}

export default useGetSongsByGenre;
