import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { db } from "@/lib/db/client";
import { playlists } from "@/lib/db/schema";
import { CACHED_QUERIES } from "@/constants";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

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
        throw new Error("ユーザーIDが必要です");
      }

      if (!isOnline) {
        throw new Error("オフライン時はプレイリストを作成できません");
      }

      // 1. Supabase に作成（IDはSupabaseで生成）
      const { data, error } = await supabase
        .from("playlists")
        .insert({
          user_id: userId,
          title,
          is_public: isPublic,
        })
        .select()
        .single();

      if (error) {
        throw new Error(error.message);
      }

      // 2. SQLite にも保存
      await db.insert(playlists).values({
        id: data.id,
        userId,
        title,
        isPublic,
        createdAt: data.created_at,
        imagePath: data.image_path,
      });

      return data;
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
