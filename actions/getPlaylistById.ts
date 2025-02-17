import { supabase } from "@/lib/supabase";
import { Playlist } from "@/types";

const getPlaylistById = async (
  playlistId: string
): Promise<Playlist | null> => {
  const { data, error } = await supabase
    .from("playlists")
    .select("*")
    .eq("id", playlistId)
    .single();

  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }

  return (data as Playlist) || null;
};

export default getPlaylistById;
