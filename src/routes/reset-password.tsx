import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Logo } from "@/components/Logo";
import { RouteError } from "@/components/RouteError";
import { RouteNotFound } from "@/components/RouteNotFound";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Redefinir senha — Yuna Skin" },
      { name: "description", content: "Defina uma nova senha para sua conta Yuna Skin." },
      { name: "robots", content: "noindex, nofollow" },
    ],
    links: [{ rel: "canonical", href: "https://yuna-flow.lovable.app/reset-password" }],
  }),
  component: ResetPasswordPage,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // Supabase populates the session from the recovery link automatically
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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
      toast.success("Senha atualizada com sucesso ✨");
      navigate({ to: "/", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar a senha.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mobile-shell flex min-h-screen flex-col justify-center px-6 py-10">
      <div className="flex flex-col items-center text-center">
        <Logo size={96} priority />
        <h1 className="mt-4 text-xl font-medium">Redefinir senha</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {ready ? "Escolha uma nova senha para sua conta." : "Validando seu link de recuperação..."}
        </p>
      </div>

      {ready && (
        <form onSubmit={handleSubmit} className="mt-10 space-y-4">
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
            />
          </div>
          <Button type="submit" disabled={busy} className="h-12 w-full rounded-full text-base">
            {busy ? "Atualizando..." : "Atualizar senha"}
          </Button>
        </form>
      )}
    </div>
  );
}
