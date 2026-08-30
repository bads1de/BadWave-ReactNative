import { supabase } from "@/lib/supabase";

/**
 * メールアドレスとパスワードでサインアップする
 *
 * @param email メールアドレス
 * @param password パスワード
 * @throws {Error} Supabase の認証エラー
 */
export const signUpWithEmail = async (
  email: string,
  password: string
): Promise<void> => {
  const { error } = await supabase.auth.signUp({ email, password });

  if (error) {
    throw error;
  }
};

export default signUpWithEmail;