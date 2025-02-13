import { supabase } from "@/lib/supabase";

const getSongs = async () => {
  const { data, error } = await supabase
    .from("songs")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }

  return data || [];
};

export default getSongs;
