import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { BottomNav } from "@/components/BottomNav";
import { LegalGate } from "@/components/LegalGate";

export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !session) {
      navigate({ to: "/auth", replace: true });
    }
  }, [loading, session, navigate]);

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
      <div className="mobile-shell pb-24">
        <Outlet />
        <BottomNav />
      </div>
    </LegalGate>
  );
}
