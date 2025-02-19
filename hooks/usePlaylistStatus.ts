import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/providers/AuthProvider";
import Toast from "react-native-toast-message";
import { Playlist } from "@/types";

interface UsePlaylistStatusProps {
  songId: string;
  playlists: Playlist[];
}

const usePlaylistStatus = ({ songId, playlists }: UsePlaylistStatusProps) => {
  const { session } = useAuth();
  const [isAdded, setIsAdded] = useState<Record<string, boolean>>({});

  const fetchAddedStatus = useCallback(async () => {
    if (!session?.user.id) {
      setIsAdded({});
      return;
    }

    try {
      const { data, error } = await supabase
        .from("playlist_songs")
        .select("playlist_id")
        .eq("song_id", songId)
        .eq("user_id", session.user.id)
        .eq("song_type", "regular");

      if (error) {
        throw new Error(error.message);
      }

      const statusMap = playlists.reduce((acc, playlist) => {
        acc[playlist.id] = data.some(
          (item) => item.playlist_id === playlist.id
        );
        return acc;
      }, {} as Record<string, boolean>);

      setIsAdded(statusMap);
    } catch (error: any) {
      console.error("Error fetching playlist status:", error);
      Toast.show({
        type: "error",
        text1: "エラーが発生しました",
        text2: error.message,
      });
    }
  }, [songId, playlists, session?.user.id]);

  useEffect(() => {
    fetchAddedStatus();
  }, [fetchAddedStatus]);

  return { isAdded, fetchAddedStatus };
};

export default usePlaylistStatus;
