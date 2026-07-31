import { useMutation, useQueryClient } from "@tanstack/react-query";
import toggleLike from "@/actions/song/toggleLike";
import { CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/common/useNetworkStatus";
import { AUTH_ERRORS, LIKE_ERRORS } from "@/constants/errorMessages";

/**
 * 曲のいいね操作を行うカスタムフック
 * オンライン時のみ操作可能。Supabase と SQLite の両方に書き込む。
 *
 * @param songId 曲のID
 * @param userId ユーザーID
 */
export function useLikeMutation(songId: string, userId?: string) {
  const queryClient = useQueryClient();
  const { isOnline } = useNetworkStatus();

  return useMutation({
    mutationFn: async (isCurrentlyLiked: boolean) => {
      if (!userId) {
        throw new Error(AUTH_ERRORS.USER_ID_REQUIRED);
      }

      if (!isOnline) {
        throw new Error(LIKE_ERRORS.OFFLINE);
      }

      return toggleLike(songId, userId, isCurrentlyLiked);
    },
    // 楽観的更新: mutate呼び出し時に即座にキャッシュを更新
    onMutate: async (isCurrentlyLiked: boolean) => {
      // 1. 既存のクエリをキャンセル（競合防止）
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.likedSongs, "status", songId, userId],
      });

      // 2. 現在のキャッシュをスナップショット（ロールバック用）
      const previousLikeStatus = queryClient.getQueryData<boolean>([
        CACHED_QUERIES.likedSongs,
        "status",
        songId,
        userId,
      ]);

      // 3. 楽観的にキャッシュを更新（即座にUIに反映）
      queryClient.setQueryData(
        [CACHED_QUERIES.likedSongs, "status", songId, userId],
        !isCurrentlyLiked
      );

      // 4. ロールバック用のコンテキストを返す
      return { previousLikeStatus };
    },
    onSuccess: async () => {
      // いいね曲リストのみ無効化（最小限の無効化で高速化）
      await queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.likedSongs],
      });
    },
    onError: (error, _variables, context) => {
      // エラー時はキャッシュを元に戻す（ロールバック）
      if (context?.previousLikeStatus !== undefined) {
        queryClient.setQueryData(
          [CACHED_QUERIES.likedSongs, "status", songId, userId],
          context.previousLikeStatus
        );
      }
      console.error("Like mutation error:", error);
    },
  });
}

export default useLikeMutation;

