import { supabase } from "@/lib/supabase";

/**
 * メールアドレスとパスワードでサインインする
 *
 * @param email メールアドレス
 * @param password パスワード
 * @throws {Error} Supabase の認証エラー
 */
export const signInWithEmail = async (
  email: string,
  password: string
): Promise<void> => {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    throw error;
  }
};

export default signInWithEmail;