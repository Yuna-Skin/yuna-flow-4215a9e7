import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { logAuditEvent } from "@/lib/audit-log.functions";
import { RouteError } from "@/components/RouteError";
import { RouteNotFound } from "@/components/RouteNotFound";

export const Route = createFileRoute("/recuperar-senha")({
  head: () => ({
    meta: [
      { title: "Recuperar senha — Yuna Skin" },
      { name: "description", content: "Recupere o acesso à sua conta Yuna Skin com o e-mail da sua compra." },
      { property: "og:title", content: "Recuperar senha — Yuna Skin" },
      { property: "og:description", content: "Recupere o acesso à sua conta Yuna Skin com o e-mail da sua compra." },
      { property: "og:url", content: "https://yuna-flow.lovable.app/recuperar-senha" },
    ],
    links: [{ rel: "canonical", href: "https://yuna-flow.lovable.app/recuperar-senha" }],
  }),
  component: RecoverPasswordPage,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

type Step = "email" | "code" | "password";

function friendlyError(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes("rate") || lower.includes("too many") || lower.includes("over_")) {
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  }
  if (lower.includes("invalid") && lower.includes("token")) {
    return "Código inválido ou expirado. Solicite um novo.";
  }
  if (lower.includes("expired")) {
    return "Código expirado. Solicite um novo.";
  }
  if (lower.includes("token has expired") || lower.includes("otp_expired")) {
    return "Código expirado. Solicite um novo.";
  }
  return raw;
}

function RecoverPasswordPage() {
  const navigate = useNavigate();
  const writeAuditLog = useServerFn(logAuditEvent);

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  const sendCode = async (resending = false) => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success(
        resending
          ? "Novo código enviado ✨"
          : "Se este e-mail tiver uma conta, enviaremos um código.",
      );
      setStep("code");
      setResendIn(60);
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Algo deu errado";
      toast.error(friendlyError(raw));
    } finally {
      setBusy(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await sendCode(false);
  };

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const token = code.replace(/\D/g, "");
    if (token.length !== 6) {
      toast.error("O código tem 6 dígitos.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: "recovery",
      });
      if (error) throw error;
      setStep("password");
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Código inválido";
      toast.error(friendlyError(raw));
    } finally {
      setBusy(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (!/\d/.test(password)) {
      toast.error("A senha precisa conter pelo menos 1 número.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      writeAuditLog({ data: { event_type: "password_reset" } }).catch((err) =>
        console.warn("audit log password_reset failed", err),
      );
      toast.success("Senha atualizada com sucesso ✨");
      navigate({ to: "/", replace: true });
    } catch (err) {
      const raw = err instanceof Error ? err.message : "Não foi possível atualizar a senha";
      toast.error(friendlyError(raw));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mobile-shell flex min-h-screen flex-col justify-center px-6 py-10">
      <div className="flex flex-col items-center text-center">
        <Logo size={96} priority />
        <h1 className="mt-4 text-xl font-medium">Recuperar senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {step === "email" && "Informe o e-mail usado na sua compra."}
          {step === "code" && (
            <>Enviamos um código de 6 dígitos para<br /><span className="font-medium text-foreground">{email}</span></>
          )}
          {step === "password" && "Crie uma nova senha para entrar."}
        </p>
      </div>

      {step === "email" && (
        <form onSubmit={handleEmailSubmit} className="mt-10 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail da compra</Label>
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
          <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base">
            {busy ? "Enviando..." : "Enviar código"}
          </Button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={handleCodeSubmit} className="mt-10 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="code">Código de verificação</Label>
            <Input
              id="code"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              required
              placeholder="000000"
              className="h-12 rounded-xl text-center text-2xl tracking-[0.5em] font-mono"
              autoComplete="one-time-code"
              autoFocus
            />
          </div>
          <Button type="submit" disabled={busy || code.length !== 6} className="h-12 w-full rounded-full text-base">
            {busy ? "Verificando..." : "Verificar código"}
          </Button>
          <div className="flex flex-col items-center gap-2 pt-2 text-sm">
            <button
              type="button"
              disabled={busy || resendIn > 0}
              onClick={() => sendCode(true)}
              className="text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              {resendIn > 0 ? `Reenviar código em ${resendIn}s` : "Reenviar código"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setCode(""); }}
              className="text-muted-foreground hover:text-foreground"
            >
              Usar outro e-mail
            </button>
          </div>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={handlePasswordSubmit} className="mt-10 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              placeholder="8+ caracteres com 1 número"
              className="h-12 rounded-xl"
              autoComplete="new-password"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm">Confirmar senha</Label>
            <Input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              required
              minLength={8}
              placeholder="Repita a nova senha"
              className="h-12 rounded-xl"
              autoComplete="new-password"
            />
          </div>
          <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base">
            {busy ? "Atualizando..." : "Atualizar senha"}
          </Button>
        </form>
      )}

      <Link
        to="/auth"
        className="mt-6 text-center text-sm text-muted-foreground hover:text-foreground"
      >
        Voltar para o login
      </Link>
    </div>
  );
}
