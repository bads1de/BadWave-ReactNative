import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { CACHE_CONFIG } from "@/constants";

type MediaType = "image" | "video";

const useLoadMedia = (
  mediaType: MediaType,
  mediaPath: string | null | undefined
) => {
  return useQuery({
    queryKey: [mediaType, mediaPath],
    queryFn: async () => {
      if (!mediaPath) return null;

      const isExternalUrl =
        mediaPath.startsWith("http://") || mediaPath.startsWith("https://");

      const { data } = await supabase.storage
        .from(`${mediaType}s`)
        .getPublicUrl(mediaPath);

      return isExternalUrl ? mediaPath : data?.publicUrl || null;
    },
    staleTime: CACHE_CONFIG.staleTime,
    gcTime: CACHE_CONFIG.gcTime,
    enabled: !!mediaPath,
  });
};

export default useLoadMedia;
