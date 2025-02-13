import Song from "@/types";
import { supabase } from "@/lib/supabase";

const getSongsByGenre = async (genre: string | string[]): Promise<Song[]> => {
  const genreArray =
    typeof genre === "string" ? genre.split(",").map((g) => g.trim()) : genre;

  // データベースから曲を検索
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .or(genreArray.map((genre) => `genre.ilike.%${genre}%`).join(","))
    .order("created_at", { ascending: false });

  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }

  return (data as any) || [];
};

export default getSongsByGenre;
