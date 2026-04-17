import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type AuthContextValue = {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const setIfChanged = (s: Session | null) => {
      setSession((prev) => {
        if (prev?.access_token === s?.access_token) return prev;
        return s;
      });
    };

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setIfChanged(s);
      if (!initialized.current) {
        initialized.current = true;
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      setIfChanged(data.session);
      if (!initialized.current) {
        initialized.current = true;
        setLoading(false);
      }
    }).catch(() => {
      initialized.current = true;
      setLoading(false);
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
