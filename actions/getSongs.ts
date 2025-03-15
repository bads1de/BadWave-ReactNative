import { supabase } from "@/lib/supabase";
import Song from "@/types";

const getSongs = async (): Promise<Song[]> => {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  return (data as Song[]) || [];
};

export default getSongs;
