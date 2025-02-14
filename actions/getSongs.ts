import { supabase } from "@/lib/supabase";
import Song from "@/types";

const getSongs = async (): Promise<Song[]> => {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }

  return (data as Song[]) || [];
};

export default getSongs;
