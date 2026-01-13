/**
 * @file AuthProvider.tsx
 * @description
 * 認証セッションを管理し、アプリケーション全体で認証状態を共有するためのプロバイダーコンポーネントです。
 * Supabaseの認証状態の変更を監視し、セッション情報をアプリケーション全体に提供します。
 */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { CACHED_QUERIES } from "@/constants";

interface AuthProviderProps {
  /** 現在の認証セッション */
  session: Session | null;
  /** 認証セッションを更新する関数 */
  setSession: (session: Session | null) => void;
}

const AuthContext = createContext<AuthProviderProps | undefined>(undefined);

/**
 * 認証プロバイダーコンポーネント
 * @param {object} props - プロパティ
 * @param {ReactNode} props.children - 子要素
 * @returns {JSX.Element}
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      // 認証状態が変更されたら、関連するキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: [CACHED_QUERIES.user] });

      // ログイン時にはレコメンデーションのキャッシュも無効化
      if (event === "SIGNED_IN") {
        queryClient.invalidateQueries({
          queryKey: [CACHED_QUERIES.getRecommendations],
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [queryClient]);

  return (
    <AuthContext.Provider value={{ session, setSession }}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * 認証コンテキストを使用するためのカスタムフックです。
 * AuthProvider内で使用する必要があります。
 * @returns {AuthProviderProps} 認証セッションとセッション更新関数を含むオブジェクト
 * @throws {Error} AuthProviderの外部で使用された場合
 */
export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }

  return context;
}

