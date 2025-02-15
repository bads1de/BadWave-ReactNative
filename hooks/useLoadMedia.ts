import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import Song, { Playlist } from "@/types";

type MediaType = "video" | "image" | "song";

const useLoadMedia = (data: Song | Playlist | null, mediaType: MediaType) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadMedia = async () => {
      if (!data) {
        setUrl(null);
        return;
      }

      const mediaPath =
        mediaType === "video"
          ? (data as Song)?.video_path
          : mediaType === "image"
          ? (data as Song | Playlist)?.image_path
          : (data as Song)?.song_path;

      if (!mediaPath) {
        setUrl(null);
        return;
      }

      try {
        const { data: mediaData } = await supabase.storage
          .from(`${mediaType}s`)
          .getPublicUrl(mediaPath);

        setUrl(mediaData?.publicUrl || null);
      } catch (error) {
        console.error(`Error loading ${mediaType}:`, error);
        setUrl(null);
      }
    };

    loadMedia();
  }, [data, mediaType]);

  return useMemo(() => url, [url]);
};

export default useLoadMedia;
