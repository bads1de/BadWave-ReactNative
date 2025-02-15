import { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import { CACHED_QUERIES } from "@/constants";
import { Ionicons } from "@expo/vector-icons";

interface LikeButtonProps {
  songId: string;
  size?: number;
}

export default function LikeButton({ songId, size }: LikeButtonProps) {
  const queryClient = useQueryClient();
  const { session } = useAuth();
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const checkLikedStatus = async () => {
      if (!session?.user.id) return;

      const { data, error } = await supabase
        .from("liked_songs_regular")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("song_id", songId)
        .single();

      if (!error && data) {
        setIsLiked(true);
      }
    };

    checkLikedStatus();
  }, [session, songId]);

  const updateLikeCount = async (increment: number) => {
    try {
      // 現在のいいね数を取得
      const { data: songData, error: fetchError } = await supabase
        .from("songs")
        .select("like_count")
        .eq("id", songId)
        .single();

      if (fetchError) throw fetchError;

      // 新しいいいね数を計算
      const newCount = (songData?.like_count || 0) + increment;

      // いいね数を更新
      const { error: updateError } = await supabase
        .from("songs")
        .update({ like_count: newCount })
        .eq("id", songId);

      if (updateError) throw updateError;
    } catch (error) {
      console.error("いいね数の更新に失敗しました:", error);
    }
  };

  const handleLike = async () => {
    if (!session?.user.id) return;

    try {
      if (isLiked) {
        // いいね解除
        await supabase
          .from("liked_songs_regular")
          .delete()
          .eq("user_id", session.user.id)
          .eq("song_id", songId);

        await updateLikeCount(-1);
      } else {
        // いいね追加
        await supabase.from("liked_songs_regular").insert({
          user_id: session.user.id,
          song_id: songId,
        });

        await updateLikeCount(1);
      }

      setIsLiked(!isLiked);
      // キャッシュの更新
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.likedSongs],
      });
      queryClient.invalidateQueries({
        queryKey: [CACHED_QUERIES.songs],
      });
    } catch (error) {
      console.error("いいね操作に失敗しました:", error);
    }
  };

  return (
    <TouchableOpacity onPress={handleLike}>
      <Ionicons
        name={isLiked ? "heart" : "heart-outline"}
        size={size || 24}
        color={isLiked ? "#FF69B4" : "white"}
      />
    </TouchableOpacity>
  );
}
