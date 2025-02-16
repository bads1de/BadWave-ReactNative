import Song from "@/types";
import useLoadMedia from "./useLoadMedia";

type VideoData = Song | null;

const useLoadVideo = (data: VideoData) => {
  const mediaPath = data && "video_path" in data ? data.video_path : null;
  return useLoadMedia("video", mediaPath);
};

export default useLoadVideo;
