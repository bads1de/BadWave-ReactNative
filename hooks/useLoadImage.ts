import Song, { Playlist } from "@/types";
import useLoadMedia from "./useLoadMedia";

type ImageData = Song | Playlist | null;

/**
 * 画像データを読み込むカスタムフック
 *
 * @param data - 画像データを含むオブジェクト
 * @returns 読み込まれた画像のURLまたは null
 */
const useLoadImage = (data: ImageData) => useLoadMedia(data, "image");

export default useLoadImage;
