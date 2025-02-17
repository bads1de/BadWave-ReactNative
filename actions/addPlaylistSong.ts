import Song from "@/types";
import { supabase } from "@/lib/supabase";
import getSongById from "./getSongById";
import updatePlaylistImage from "./updatePlaylistImage";

interface AddPlaylistSongProps {
  playlistId: string;
  userId: string;
  songId: string;
}

const addPlaylistSong = async ({
  playlistId,
  userId,
  songId,
}: AddPlaylistSongProps) => {
  const { error } = await supabase.from("playlist_songs").insert({
    playlist_id: playlistId,
    user_id: userId,
    song_id: songId,
    song_type: "regular",
  });

  if (error) throw error;

  const songData = await getSongById(songId);

  if (!songData?.image_path) {
    await updatePlaylistImage(playlistId, songData.image_path);
  }

  return { playlistId, songData };
};

export default addPlaylistSong;
