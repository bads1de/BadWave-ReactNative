import { supabase } from "@/lib/supabase";
import { useState, useEffect, useMemo } from "react";
import Song, { Playlist } from "@/types";

type ImageData = Song | Playlist | null;

/**
 * 画像データを読み込むカスタムフック
 *
 * @param data - 画像データを含むオブジェクト
 * @returns 読み込まれた画像のURLまたは null
 */
const useLoadImage = (data: ImageData) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!data) {
      setImageUrl(null);
      return;
    }

    const loadImage = async () => {
      const imagePath = "image_path" in data ? data.image_path : null;

      if (!imagePath) {
        setImageUrl(null);
        return;
      }

      try {
        const { data: imageData } = await supabase.storage
          .from("images")
          .getPublicUrl(imagePath);

        setImageUrl(imageData?.publicUrl || null);
      } catch (error) {
        console.error(error);
        setImageUrl(null);
      }
    };

    loadImage();
  }, [data]);

  return useMemo(() => imageUrl, [imageUrl]);
};

export default useLoadImage;
