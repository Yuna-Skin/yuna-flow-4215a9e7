import { createFileRoute, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { LegalGate } from "@/components/LegalGate";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // Sessão agora vive em cookie (lida tanto no client quanto no server).
    // getUser() valida o token contra o Supabase.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", replace: true });
    }
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/auth", replace: true });
    }
  }, [loading, session, navigate]);

  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname]);

  if (loading) {
    return (
      <div className="mobile-shell flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mobile-shell flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-sm text-muted-foreground">Você precisa entrar para continuar.</p>
        <button
          onClick={() => navigate({ to: "/auth", replace: true })}
          className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground"
        >
          Ir para login
        </button>
      </div>
    );
  }

  return (
    <LegalGate>
      <div className="mobile-shell app-shell">
        <main ref={mainRef} className="app-shell-main">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </LegalGate>
  );
}
