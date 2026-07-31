import { SUPABASE_TABLES } from "@/constants";
import { supabase } from "@/lib/supabase";
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
    .from(SUPABASE_TABLES.users)
    .select("*")
    .eq("id", session.user.id)
    .single();

  if (error) {
    console.error(getErrorMessage(error));
    throw new Error(getErrorMessage(error));
  }

  return data || null;
};
