import { supabase } from "@/lib/supabase";

const createPlaylist = async (name: string): Promise<void> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("User not authenticated");
  }

  const { error } = await supabase.from("playlists").insert({
    user_id: session?.user.id,
    title: name,
  });

  if (error) {
    console.error(error.message);
    throw new Error(error.message);
  }
};

export default createPlaylist;
