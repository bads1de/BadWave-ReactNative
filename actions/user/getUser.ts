import { SUPABASE_TABLES } from "@/constants";
import { supabase } from "@/lib/supabase";
import { User } from "@/types";
import { runQuery } from "@/lib/utils/supabaseQuery";
import { AUTH_ERRORS } from "@/constants/errorMessages";

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
    throw new Error(AUTH_ERRORS.SESSION_REQUIRED);
  }

  const data = await runQuery(async () =>
    supabase
      .from(SUPABASE_TABLES.users)
      .select("*")
      .eq("id", session.user.id)
      .single(),
  );

  return data || null;
};
