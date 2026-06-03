import { CACHED_QUERIES } from "@/constants";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { User } from "@/types";
import { getErrorMessage } from "@/lib/utils/error";

/**
 * ユーザー情報を取得する関数
 * @returns {Promise<User | null>} ユーザー情報
 * @throws {Error} セッションが存在しない場合、またはデータ取得時にエラーが発生した場合
 */
export const getUser = async (): Promise<User | null> => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw null;
  }

  const { data, error } = await supabase
    .from("users")
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error) {
    console.error(getErrorMessage(error));
    throw new Error(getErrorMessage(error));
  }

  return data || null;
};

/**
 * ユーザー情報を取得するためのカスタムフック
 * @returns {UseQueryResult<User | null, Error>} ユーザー情報のクエリ結果
 */
export const useUser = () => {
  return useQuery({
    queryKey: [CACHED_QUERIES.user],
    queryFn: getUser,
  });
};
