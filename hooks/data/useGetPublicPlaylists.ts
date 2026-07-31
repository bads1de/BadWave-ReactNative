import { useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import getPublicPlaylists from "@/actions/playlist/getPublicPlaylists";

/**
 * 公開プレイリストを取得するカスタムフック
 * @param {number} limit 取得する件数
 * @returns {UseQueryResult<Playlist[], Error>} 公開プレイリストのクエリ結果
 */
export function useGetPublicPlaylists(limit: number = 10) {
  return useQuery({
    queryKey: [CACHED_QUERIES.getPublicPlaylists],
    queryFn: () => getPublicPlaylists(limit),
    staleTime: 1000 * 60 * 5, // 5分
    refetchOnWindowFocus: false,
  });
}

export default useGetPublicPlaylists;
