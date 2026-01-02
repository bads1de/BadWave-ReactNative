import { useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { Playlist } from "@/types";
import { useQuery } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import getSongPlaylistStatus from "@/actions/getSongPlaylistStatus";

interface UsePlaylistStatusProps {
  songId: string;
  playlists: Playlist[];
}

/**
 * usePlaylistStatus フックは、特定の曲が各プレイリストに含まれているかどうかを管理します。
 * TanStack Query を使用してフェッチとキャッシュを管理します。
 *
 * @param {Object} props - プロパティ。
 * @param {string} props.songId - 曲の ID。
 * @param {Playlist[]} props.playlists - プレイリストのリスト。
 *
 * @returns {Object} useQuery の結果オブジェクト。data には Record<string, boolean> が含まれます。
 */
const usePlaylistStatus = ({ songId, playlists }: UsePlaylistStatusProps) => {
  const { session } = useAuth();

  const selectFn = useCallback(
    (data: string[]) => {
      const statusMap: Record<string, boolean> = {};
      playlists.forEach((playlist) => {
        statusMap[playlist.id] = data.includes(playlist.id);
      });
      return statusMap;
    },
    [playlists]
  );

  return useQuery({
    queryKey: [CACHED_QUERIES.playlistStatus, songId],
    queryFn: () => getSongPlaylistStatus(songId),
    select: selectFn,
    enabled: !!songId && !!session?.user.id,
  });
};

export default usePlaylistStatus;
