import { createFileRoute, Outlet, redirect, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";
import { LegalGate } from "@/components/LegalGate";
import { PaymentGate } from "@/components/PaymentGate";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: async () => {
    // getSession() lê de cookie (SSR) OU memória (cliente após login),
    // tolerando ambientes onde o cookie third-party do iframe é bloqueado.
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
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
  const [sideNavCollapsed, setSideNavCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("yuna:sidebar-collapsed") === "1";
  });

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
      <PaymentGate>
        <div className={cn("mobile-shell app-shell", sideNavCollapsed && "app-shell--nav-collapsed")}>
          <SideNav
            collapsed={sideNavCollapsed}
            onToggle={() => {
              setSideNavCollapsed((c) => {
                const next = !c;
                window.localStorage.setItem("yuna:sidebar-collapsed", next ? "1" : "0");
                return next;
              });
            }}
          />
          <main ref={mainRef} className="app-shell-main">
            <Outlet />
          </main>
          <div className="md:hidden">
            <BottomNav />
          </div>
        </div>
      </PaymentGate>
    </LegalGate>
  );
}
