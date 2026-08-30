import { supabase } from "@/lib/supabase";

/**
 * サインアウトする
 *
 * @throws {Error} Supabase の認証エラー
 */
export const signOut = async (): Promise<void> => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
};

export default signOut;