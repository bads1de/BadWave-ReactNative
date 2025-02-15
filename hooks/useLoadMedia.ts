import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Song, { Playlist } from "@/types";

type MediaType = "video" | "image";

/**
 * メディアファイルの公開URLを取得するためのカスタムフック。
 *
 * @param {Song | Playlist | null} data - メディアファイルの情報を含むオブジェクト。Song または Playlist 型。
 * @param {MediaType} mediaType - 取得するメディアのタイプ。"video", "image", "song" のいずれか。
 * @returns {string | null} メディアファイルの公開URL。メディアファイルが存在しない場合はnull。
 */
const useLoadMedia = (data: Song | Playlist | null, mediaType: MediaType) => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    /**
     * メディアファイルの公開URLをSupabaseストレージから取得し、ステートに設定する関数。
     */
    const loadMedia = async () => {
      if (!data) {
        setUrl(null);
        return;
      }

      // mediaType に応じて、適切なファイルパスを取得
      const mediaPath =
        mediaType === "video"
          ? (data as Song)?.video_path
          : mediaType === "image"
          ? (data as Song | Playlist)?.image_path
          : null;

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
