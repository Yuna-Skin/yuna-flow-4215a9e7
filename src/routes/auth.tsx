import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { useServerFn } from "@tanstack/react-start";
import { logAuditEvent } from "@/lib/audit-log.functions";
import { RouteError } from "@/components/RouteError";
import { RouteNotFound } from "@/components/RouteNotFound";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Yuna Skin" },
      { name: "description", content: "Acesse o Yuna Skin e continue sua jornada de autocuidado facial guiado." },
      { property: "og:title", content: "Entrar — Yuna Skin" },
      { property: "og:description", content: "Acesse o Yuna Skin e continue sua jornada de autocuidado facial guiado." },
      { property: "og:url", content: "https://yuna-flow.lovable.app/auth" },
    ],
    links: [{ rel: "canonical", href: "https://yuna-flow.lovable.app/auth" }],
  }),
  component: AuthPage,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function AuthPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const writeAuditLog = useServerFn(logAuditEvent);

  useEffect(() => {
    if (session) navigate({ to: "/", replace: true });
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) {
        await supabase.auth.getSession();
        navigate({ to: "/", replace: true });
      }
      writeAuditLog({ data: { event_type: "login" } }).catch((e) =>
        console.warn("audit log login failed", e),
      );
      toast.success("Bom te ver de volta ✨");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Algo deu errado";
      const lower = raw.toLowerCase();
      let friendly = raw;
      if (lower.includes("rate") || lower.includes("too many") || lower.includes("over_")) {
        friendly = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
      } else if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
        friendly = "E-mail ou senha incorretos.";
      } else if (lower.includes("email not confirmed")) {
        friendly = "Confirme seu e-mail antes de entrar.";
      }
      toast.error(friendly);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mobile-shell flex min-h-screen flex-col justify-center px-6 py-10">
      <div className="flex flex-col items-center text-center">
        <Logo size={96} priority />
        <p className="mt-4 text-sm text-muted-foreground">
          Sua rotina de beleza natural.<br />Poucos minutos por dia.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-10 space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="voce@email.com"
            className="h-12 rounded-xl"
            autoComplete="email"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Sua senha"
            className="h-12 rounded-xl"
            autoComplete="current-password"
          />
        </div>

        <Button
          type="submit"
          disabled={busy}
          className="h-12 w-full rounded-full text-base"
        >
          {busy ? "Aguarde..." : "Entrar"}
        </Button>
      </form>

      <Link
        to="/recuperar-senha"
        className="mt-6 text-center text-sm text-muted-foreground hover:text-foreground"
      >
        Esqueceu a senha? <span className="font-medium text-primary">Recuperar agora</span>
      </Link>
    </div>
  );
}
