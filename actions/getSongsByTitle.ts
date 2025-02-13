import { supabase } from "@/lib/supabase";
import Song from "@/types";

const getSongsByTitle = async (title: string): Promise<Song[]> => {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .ilike("title", `%${title}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.log(error);
    throw new Error(error.message);
  }

  return (data as Song[]) || [];
};

export default getSongsByTitle;
