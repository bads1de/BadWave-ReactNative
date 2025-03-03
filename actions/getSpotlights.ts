import { Spotlight } from "@/types";
import { supabase } from "@/lib/supabase";

const getSpotlights = async (): Promise<Spotlight[]> => {
  const { data, error } = await supabase
    .from("spotlights")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }

  return (data as Spotlight[]) || [];
};

export default getSpotlights;
