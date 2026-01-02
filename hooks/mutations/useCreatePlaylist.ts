import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { playlists } from "@/lib/db/schema";
import { CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { withSupabaseRetry } from "@/lib/utils/retry";
import { AUTH_ERRORS, PLAYLIST_ERRORS } from "@/constants/errorMessages";

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

      // 1. Supabase に作成（IDはSupabaseで生成、リトライ付き）
      const result = await withSupabaseRetry(async () => {
        return await supabase
          .from("playlists")
          .insert({
            user_id: userId,
            title,
            is_public: isPublic,
          })
          .select()
          .single();
      });

      if (result.error) {
        throw new Error(
          `${PLAYLIST_ERRORS.SUPABASE_INSERT_FAILED}: ${result.error.message}`
        );
      }

      // 2. SQLite にも保存
      await db.insert(playlists).values({
        id: result.data.id,
        userId,
        title,
        isPublic,
        createdAt: result.data.created_at,
        imagePath: result.data.image_path,
      });

      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.playlists],
      });
    },
    onError: (error) => {
      console.error("Error creating playlist:", error);
    },
  });
}

export default useCreatePlaylist;
