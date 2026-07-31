import { useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import getTopPlayedSongs from "@/actions/song/getTopPlayedSongs";

/**
 * ユーザーの最もよく再生された曲を取得するカスタムフック
 * @param {string} userId ユーザーID
 * @returns {UseQueryResult<TopPlayedSong[], Error>} 再生回数順にソートされた曲のクエリ結果
 */
export function useGetTopPlayedSongs(userId?: string) {
  return useQuery({
    queryKey: [CACHED_QUERIES.topPlayedSongs, userId],
    queryFn: () => getTopPlayedSongs(userId),
    enabled: !!userId,
  });
}

export default useGetTopPlayedSongs;
