import { useMutation, useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { withSupabaseRetry } from "@/lib/utils/retry";
import { AUTH_ERRORS, PLAYLIST_ERRORS } from "@/constants/errorMessages";
import createPlaylist from "@/actions/playlist/createPlaylist";
import { Playlist } from "@/types";

/**
 * プレイリスト作成のミューテーションフック
 * オンライン時のみ操作可能。Supabase と SQLite の両方に書き込む。
 *
 * @param userId ユーザーID
 */
export function useCreatePlaylist(userId?: string) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  return useMutation({
    mutationFn: async ({
      title,
      isPublic = false,
    }: {
      title: string;
      isPublic?: boolean;
    }) => {
      if (!userId) {
        throw new Error(AUTH_ERRORS.USER_ID_REQUIRED);
      }

      if (!isOnline) {
        throw new Error(PLAYLIST_ERRORS.OFFLINE);
      }

      // リトライ付きでアクションを呼び出す
      return withSupabaseRetry(() =>
        createPlaylist({ userId, title, isPublic })
      );
    },
    onMutate: async ({ title }) => {
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.playlists],
      });

      const previousPlaylists = queryClient.getQueryData<Playlist[]>([
        CACHED_QUERIES.playlists,
      ]);

      queryClient.setQueryData<Playlist[]>([CACHED_QUERIES.playlists], (old) => [
        ...(old || []),
        {
          id: `temp_${Date.now()}`,
          title,
          is_public: false,
          user_id: userId ?? "",
          created_at: new Date().toISOString(),
        },
      ]);

      return { previousPlaylists };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlists],
      });
    },
    onError: (_error, _variables, context) => {
      if (context?.previousPlaylists) {
        queryClient.setQueryData(
          [CACHED_QUERIES.playlists],
          context.previousPlaylists,
        );
      }
    },
  });
}

export default useCreatePlaylist;
