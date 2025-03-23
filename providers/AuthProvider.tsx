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
  session: Session | null;
  setSession: (session: Session | null) => void;
}

const AuthContext = createContext<AuthProviderProps | undefined>(undefined);

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

export function useAuth() {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within a AuthProvider");
  }

  return context;
}
