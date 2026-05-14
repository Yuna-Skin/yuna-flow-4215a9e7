import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { deleteMyAccount } from "@/lib/account.functions";

export const Route = createFileRoute("/_authenticated/settings/privacy")({
  component: PrivacyPage,
});

type Step = "intro" | "password" | "confirm";

function PrivacyPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const callDelete = useServerFn(deleteMyAccount);

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("intro");
  const [password, setPassword] = useState("");
  const [acknowledge, setAcknowledge] = useState(false);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setStep("intro");
    setPassword("");
    setAcknowledge(false);
    setBusy(false);
  };

  const handleClose = (next: boolean) => {
    if (busy) return;
    setOpen(next);
    if (!next) reset();
  };

  const handleStart = () => {
    setOpen(true);
  };

  const handleVerifyPassword = async () => {
    if (!user?.email || !password) return;
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: user.email,
      password,
    });
    setBusy(false);
    if (error) {
      toast.error("Senha incorreta");
      return;
    }
    setStep("confirm");
  };

  const handleConfirmDelete = async () => {
    setBusy(true);
    try {
      await callDelete();
      toast.success("Sua conta foi excluída.");
      await signOut();
      navigate({ to: "/auth", replace: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro ao excluir";
      toast.error(msg);
      setBusy(false);
    }
  };

  return (
    <div className="px-5 pb-6 pt-8">
      <Link
        to="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <h1 className="mt-4 font-display text-3xl text-foreground">
        Privacidade e dados
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Gerencie suas informações pessoais
      </p>

      <section className="mt-8">
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Seus dados
          </p>
          <p className="mt-2 text-sm leading-relaxed text-foreground/90">
            Você pode solicitar acesso, correção, portabilidade ou exclusão dos
            seus dados a qualquer momento. Para acesso e portabilidade, escreva
            para <strong>privacidade@yuna.com</strong>.
          </p>
        </div>
      </section>

      <section className="mt-6">
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5">
          <div className="flex items-center gap-2">
            <Trash2 className="h-4 w-4 text-destructive" />
            <p className="font-medium text-destructive">Excluir minha conta</p>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-foreground/80">
            A exclusão é definitiva. Você perderá o acesso à sua jornada,
            histórico e configurações. Alguns dados podem ser preservados por
            exigência legal (logs de auditoria, registros financeiros e
            antifraude).
          </p>
          <Button
            onClick={handleStart}
            variant="destructive"
            className="mt-4 h-11 w-full rounded-full"
          >
            Continuar
          </Button>
        </div>
      </section>

      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-sm rounded-3xl">
          {step === "intro" && (
            <>
              <DialogHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <DialogTitle className="text-center font-display text-xl">
                  Antes de continuar
                </DialogTitle>
                <DialogDescription className="text-center">
                  Você está prestes a excluir sua conta. Essa ação é permanente
                  e não pode ser desfeita.
                </DialogDescription>
              </DialogHeader>
              <ul className="space-y-2 rounded-xl bg-muted/50 p-4 text-sm text-foreground/80">
                <li>• Perda de acesso à sua jornada</li>
                <li>• Histórico de progresso apagado</li>
                <li>• Foto de perfil e dados pessoais removidos</li>
                <li>• Reembolsos seguem a política da plataforma de pagamento</li>
              </ul>
              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  variant="destructive"
                  className="h-11 w-full rounded-full"
                  onClick={() => setStep("password")}
                >
                  Quero excluir mesmo assim
                </Button>
                <Button
                  variant="ghost"
                  className="h-11 w-full rounded-full"
                  onClick={() => handleClose(false)}
                >
                  Cancelar
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "password" && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl">
                  Confirme sua senha
                </DialogTitle>
                <DialogDescription>
                  Por segurança, precisamos confirmar que é você.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Senha</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Sua senha"
                    className="h-11 rounded-xl"
                    autoFocus
                  />
                </div>
              </div>
              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  className="h-11 w-full rounded-full"
                  disabled={!password || busy}
                  onClick={handleVerifyPassword}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Continuar"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="h-11 w-full rounded-full"
                  onClick={() => setStep("intro")}
                  disabled={busy}
                >
                  Voltar
                </Button>
              </DialogFooter>
            </>
          )}

          {step === "confirm" && (
            <>
              <DialogHeader>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                  <Trash2 className="h-6 w-6 text-destructive" />
                </div>
                <DialogTitle className="text-center font-display text-xl">
                  Confirmação final
                </DialogTitle>
                <DialogDescription className="text-center">
                  Esta é sua última chance de cancelar. A exclusão será
                  imediata e definitiva.
                </DialogDescription>
              </DialogHeader>
              <label className="flex items-start gap-3 rounded-xl bg-muted/50 p-4 text-sm text-foreground/80">
                <Checkbox
                  checked={acknowledge}
                  onCheckedChange={(v) => setAcknowledge(v === true)}
                  className="mt-0.5"
                />
                <span>
                  Entendo que perderei o acesso permanente à minha conta e que
                  esta ação não pode ser revertida.
                </span>
              </label>
              <DialogFooter className="flex-col gap-2 sm:flex-col">
                <Button
                  variant="destructive"
                  className="h-11 w-full rounded-full"
                  disabled={!acknowledge || busy}
                  onClick={handleConfirmDelete}
                >
                  {busy ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Excluir minha conta"
                  )}
                </Button>
                <Button
                  variant="ghost"
                  className="h-11 w-full rounded-full"
                  onClick={() => handleClose(false)}
                  disabled={busy}
                >
                  Cancelar
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
