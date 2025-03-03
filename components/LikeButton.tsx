import { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import {
  useQueryClient,
  useMutation,
  useMutationState,
} from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { CACHED_QUERIES } from "@/constants";
import { Ionicons } from "@expo/vector-icons";
import Song from "@/types";
import Toast from "react-native-toast-message";

interface LikeButtonProps {
  songId: string;
  size?: number;
}

export default function LikeButton({ songId, size }: LikeButtonProps) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [isLiked, setIsLiked] = useState(false);

  // 楽観的更新の状態追跡
  const pendingMutations = useMutationState({
    filters: { mutationKey: [CACHED_QUERIES.likedSongs], status: "pending" },
    select: (mutation) => mutation.state.variables,
  });

  const isPending = pendingMutations.length > 0;

  // 初期いいね状態取得
  useEffect(() => {
    const checkLikedStatus = async () => {
      if (!session?.user.id) return;

      const { data } = await supabase
        .from("liked_songs_regular")
        .select()
        .match({ user_id: session.user.id, song_id: songId });

      setIsLiked(!!data?.length);
    };

    checkLikedStatus();
  }, [session, songId]);

  // いいね数更新関数
  const updateLikeCount = async (increment: number) => {
    const { data: songData } = await supabase
      .from("songs")
      .select("like_count")
      .eq("id", songId)
      .single();

    const newCount = (songData?.like_count || 0) + increment;

    await supabase
      .from("songs")
      .update({ like_count: newCount })
      .eq("id", songId);
  };

  // ミューテーション処理
  const { mutate } = useMutation({
    mutationKey: [CACHED_QUERIES.likedSongs, songId],
    mutationFn: async () => {
      if (!session?.user.id) throw new Error("未認証ユーザー");

      if (isLiked) {
        await supabase
          .from("liked_songs_regular")
          .delete()
          .match({ user_id: session.user.id, song_id: songId });
        await updateLikeCount(-1);
      } else {
        await supabase
          .from("liked_songs_regular")
          .insert({ user_id: session.user.id, song_id: songId });
        await updateLikeCount(1);
      }
      return !isLiked;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({
        queryKey: [CACHED_QUERIES.likedSongs],
      });
      await queryClient.cancelQueries({ queryKey: [CACHED_QUERIES.songs] });

      const previousSongs = queryClient.getQueryData<Song[]>([
        CACHED_QUERIES.songs,
      ]);
      const previousLiked = queryClient.getQueryData<Song[]>([
        CACHED_QUERIES.likedSongs,
      ]);

      // 楽観的更新
      queryClient.setQueryData([CACHED_QUERIES.songs], (old: Song[] = []) =>
        old.map((song) =>
          song.id === songId
            ? {
                ...song,
                like_count: Number(song.like_count ?? 0) + (isLiked ? -1 : 1),
              }
            : song
        )
      );

      queryClient.setQueryData(
        [CACHED_QUERIES.likedSongs],
        (old: Song[] = []) =>
          isLiked
            ? old.filter((song) => song.id !== songId)
            : [...old, ...(previousSongs?.filter((s) => s.id === songId) || [])]
      );

      return { previousSongs, previousLiked };
    },
    onError: (err, _, context) => {
      queryClient.setQueryData([CACHED_QUERIES.songs], context?.previousSongs);
      queryClient.setQueryData(
        [CACHED_QUERIES.likedSongs],
        context?.previousLiked
      );

      Toast.show({
        type: "error",
        text1: "通信エラーが発生しました",
        text2: "しばらくしてから再試行してください",
      });
    },
    onSuccess: (result) => {
      if (typeof result === "boolean") {
        setIsLiked(result);
      }

      Toast.show({
        type: "success",
        text1: result ? "いいねしました！" : "いいねを解除しました",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.likedSongs] });
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.songs] });
    },
  });

  return (
    <TouchableOpacity
      onPress={() => {
        if (!session) {
          Toast.show({
            type: "info",
            text1: "ログインが必要です",
            text2: "いいね機能を使うにはログインしてください",
          });
          return;
        }
        mutate();
      }}
      disabled={isPending}
    >
      <Ionicons
        name={isLiked ? "heart" : "heart-outline"}
        size={size || 24}
        color={isLiked ? "#FF69B4" : "white"}
        opacity={isPending ? 0.5 : 1}
      />
    </TouchableOpacity>
  );
}
