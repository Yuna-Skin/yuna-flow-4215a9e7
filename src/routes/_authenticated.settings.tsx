import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { ChevronRight, ArrowLeft, Shield, FileText, Cookie, Lock, Info, Receipt, Sun, Moon, Monitor } from "lucide-react";
import { RouteError } from "@/components/RouteError";
import { RouteNotFound } from "@/components/RouteNotFound";
import { useTheme, type Theme } from "@/lib/theme";

export const Route = createFileRoute("/_authenticated/settings")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  component: SettingsPage,
});

function SettingsPage() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  if (pathname !== "/settings") {
    return <Outlet />;
  }

  return (
    <div className="px-5 pb-6 pt-8">
      <Link
        to="/profile"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <h1 className="mt-4 font-display text-3xl text-foreground">Configurações</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Privacidade, segurança e seus dados
      </p>

      <section className="mt-8">
        <p className="px-1 text-xs uppercase tracking-widest text-muted-foreground">
          Aparência
        </p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card p-2">
          <AppearanceToggle />
        </div>
      </section>

      <section className="mt-6">
        <p className="px-1 text-xs uppercase tracking-widest text-muted-foreground">
          Privacidade
        </p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card">
          <Link
            to="/settings/privacy"
            className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
          >
            <span className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Privacidade e dados
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </section>

      <section className="mt-6">
        <p className="px-1 text-xs uppercase tracking-widest text-muted-foreground">
          Documentos legais
        </p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-card divide-y divide-border">
          <Link
            to="/termos-de-uso"
            className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
          >
            <span className="flex items-center gap-3">
              <FileText className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">Termos de Uso</span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            to="/politica-de-privacidade"
            className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
          >
            <span className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Política de Privacidade
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            to="/politica-de-cookies"
            className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
          >
            <span className="flex items-center gap-3">
              <Cookie className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Política de Cookies
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            to="/reembolso"
            className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
          >
            <span className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Política de Reembolso
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
          <Link
            to="/sobre"
            className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-muted/40"
          >
            <span className="flex items-center gap-3">
              <Info className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                Sobre o Yuna Skin
              </span>
            </span>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>
        </div>
      </section>
    </div>
  );
}

function AppearanceToggle() {
  const { theme, setTheme } = useTheme();
  const options: { value: Theme; label: string; Icon: typeof Sun }[] = [
    { value: "light", label: "Claro", Icon: Sun },
    { value: "dark", label: "Escuro", Icon: Moon },
    { value: "system", label: "Sistema", Icon: Monitor },
  ];
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {options.map(({ value, label, Icon }) => {
        const active = theme === value;
        return (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={
              "flex flex-col items-center justify-center gap-1.5 rounded-xl px-3 py-3 text-xs font-medium transition-all " +
              (active
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground")
            }
            aria-pressed={active}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
