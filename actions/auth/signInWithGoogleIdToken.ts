import { supabase } from "@/lib/supabase";
import { AUTH_ERRORS } from "@/constants/errorMessages";

/**
 * Google サインインで取得した ID トークンで Supabase にサインインする
 *
 * @param idToken GoogleSignin から取得した ID トークン
 * @throws {Error} ユーザー情報が取得できない場合、または Supabase の認証エラー
 */
export const signInWithGoogleIdToken = async (
  idToken: string
): Promise<void> => {
  const { error, data } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: idToken,
  });

  if (error) {
    throw error;
  }

  if (!data.user) {
    throw new Error(AUTH_ERRORS.GOOGLE_SIGNIN_FAILED);
  }
};

export default signInWithGoogleIdToken;