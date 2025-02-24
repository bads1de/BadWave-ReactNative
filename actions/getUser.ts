import { CACHED_QUERIES } from "@/constants";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";

const getUser = async (): Promise<any> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", session?.user.id)
    .single();

  if (error) {
    console.log(error.message);
    throw new Error(error.message);
  }

  return (data as any) || null;
};

export const useUser = () => {
  return useQuery({
    queryKey: [CACHED_QUERIES.user],
    queryFn: getUser,
  });
};
