import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { recordConsent } from "@/lib/consent.functions";
import { logAuditEvent } from "@/lib/audit-log.functions";
import { TERMS_VERSION, PRIVACY_VERSION } from "@/lib/legal-versions";
import { RouteError } from "@/components/RouteError";
import { RouteNotFound } from "@/components/RouteNotFound";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — Yuna Skin" },
      { name: "description", content: "Acesse o Yuna Skin e comece sua jornada de autocuidado facial guiado." },
      { property: "og:title", content: "Entrar — Yuna Skin" },
      { property: "og:description", content: "Acesse o Yuna Skin e comece sua jornada de autocuidado facial guiado." },
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
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [acceptPrivacy, setAcceptPrivacy] = useState(false);
  const [busy, setBusy] = useState(false);
  const submitConsent = useServerFn(recordConsent);
  const writeAuditLog = useServerFn(logAuditEvent);

  useEffect(() => {
    if (session) navigate({ to: "/", replace: true });
  }, [session, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && (!acceptTerms || !acceptPrivacy)) {
      toast.error("Você precisa aceitar os Termos e a Política para continuar.");
      return;
    }
    if (mode === "signup") {
      if (password.length < 8) {
        toast.error("A senha precisa ter pelo menos 8 caracteres.");
        return;
      }
      if (!/\d/.test(password)) {
        toast.error("A senha precisa conter pelo menos 1 número.");
        return;
      }
    }
    setBusy(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { name },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });
        if (error) throw error;

        // Registra consentimento + log jurídico (best-effort)
        try {
          await submitConsent({
            data: {
              accepted_terms: true,
              accepted_privacy: true,
              terms_version: TERMS_VERSION,
              privacy_version: PRIVACY_VERSION,
            },
          });
          await writeAuditLog({
            data: {
              event_type: "account_created",
              terms_version: TERMS_VERSION,
              privacy_version: PRIVACY_VERSION,
            },
          });
        } catch (err) {
          console.warn("Falha ao registrar consentimento/log no signup", err);
        }

        toast.success("Conta criada! Bem-vinda ao Yuna Skin 🌸");

        if (data.session) {
          navigate({ to: "/", replace: true });
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data.session) {
          await supabase.auth.getSession();
          navigate({ to: "/", replace: true });
        }

        // Log jurídico de login (best-effort, não bloqueia o fluxo)
        writeAuditLog({ data: { event_type: "login" } }).catch((e) =>
          console.warn("audit log login failed", e),
        );
        toast.success("Bom te ver de volta ✨");
      }
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Algo deu errado";
      const lower = raw.toLowerCase();
      let friendly = raw;
      if (lower.includes("rate") || lower.includes("too many") || lower.includes("over_") ) {
        friendly = "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
      } else if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
        friendly = "E-mail ou senha incorretos.";
      } else if (lower.includes("email not confirmed")) {
        friendly = "Confirme seu e-mail antes de entrar.";
      } else if (lower.includes("user already registered")) {
        friendly = "Esse e-mail já tem conta. Tente entrar.";
      } else if (lower.includes("weak password") || lower.includes("password should")) {
        friendly = "Senha fraca. Use 8+ caracteres com números.";
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
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Seu nome"
              className="h-12 rounded-xl"
            />
          </div>
        )}
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
            minLength={mode === "signup" ? 8 : 6}
            placeholder={mode === "signup" ? "8+ caracteres com 1 número" : "Sua senha"}
            className="h-12 rounded-xl"
          />
        </div>

        {mode === "signup" && (
          <div className="space-y-2.5 pt-1">
            <label className="flex items-start gap-2.5 text-sm">
              <Checkbox
                checked={acceptTerms}
                onCheckedChange={(v) => setAcceptTerms(v === true)}
                className="mt-0.5"
              />
              <span className="text-muted-foreground">
                Li e aceito os{" "}
                <Link
                  to="/termos-de-uso"
                  target="_blank"
                  className="font-medium text-primary underline"
                >
                  Termos de Uso
                </Link>
              </span>
            </label>
            <label className="flex items-start gap-2.5 text-sm">
              <Checkbox
                checked={acceptPrivacy}
                onCheckedChange={(v) => setAcceptPrivacy(v === true)}
                className="mt-0.5"
              />
              <span className="text-muted-foreground">
                Li e aceito a{" "}
                <Link
                  to="/politica-de-privacidade"
                  target="_blank"
                  className="font-medium text-primary underline"
                >
                  Política de Privacidade
                </Link>
              </span>
            </label>
          </div>
        )}

        <Button
          type="submit"
          disabled={busy || (mode === "signup" && (!acceptTerms || !acceptPrivacy))}
          className="h-12 w-full rounded-full text-base"
        >
          {busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar conta"}
        </Button>
      </form>

      <button
        type="button"
        onClick={() => setMode(mode === "login" ? "signup" : "login")}
        className="mt-6 text-center text-sm text-muted-foreground hover:text-foreground"
      >
        {mode === "login" ? (
          <>Ainda não tem conta? <span className="font-medium text-primary">Criar agora</span></>
        ) : (
          <>Já tem conta? <span className="font-medium text-primary">Entrar</span></>
        )}
      </button>
    </div>
  );
}
