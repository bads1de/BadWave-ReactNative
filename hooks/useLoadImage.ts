import Song, { Playlist } from "@/types";
import useLoadMedia from "./useLoadMedia";

type ImageData = Song | Playlist | null;

const useLoadImage = (data: ImageData) => {
  const mediaPath = data && "image_path" in data ? data.image_path : null;
  return useLoadMedia("image", mediaPath);
};

export default useLoadImage;
