import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import Song from "@/types";
import useLoadMedia from "./useLoadMedia";

type VideoData = Song | null;

/**
 * 動画のURLを読み込むカスタムフック
 *
 * @param {VideoData} data - 動画データを含むオブジェクト
 * @returns {string|null} 読み込まれた動画のURL
 */
const useLoadVideo = (data: Song | null) => useLoadMedia(data, "video");

export default useLoadVideo;
