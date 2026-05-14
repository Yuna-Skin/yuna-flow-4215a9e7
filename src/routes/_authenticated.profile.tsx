import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LogOut, CheckCircle2, TrendingUp } from "lucide-react";

export const Route = createFileRoute("/_authenticated/profile")({
  component: ProfilePage,
});

function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("Praticante");
  const [completed, setCompleted] = useState(0);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: prof }, { count }] = await Promise.all([
        supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
        supabase.from("user_progress").select("*", { count: "exact", head: true }).eq("user_id", user.id).eq("completed", true),
      ]);
      if (prof?.name) setName(prof.name);
      setCompleted(count ?? 0);
    })();
  }, [user]);

  const handleLogout = async () => {
    await signOut();
    navigate({ to: "/auth" });
  };

  const progress = Math.round((completed / 28) * 100);

  return (
    <div className="px-5 pb-6 pt-8">
      <h1 className="font-display text-3xl text-foreground">Perfil</h1>

      <div className="mt-6 flex flex-col items-center text-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-primary to-warm text-3xl font-display text-primary-foreground">
          {name[0]?.toUpperCase()}
        </div>
        <p className="mt-4 font-display text-2xl text-foreground">{name}</p>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Card className="flex flex-col items-center p-4">
          <CheckCircle2 className="h-5 w-5 text-primary" />
          <p className="mt-2 text-2xl font-display text-foreground">{completed}</p>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Dias</p>
        </Card>
        <Card className="flex flex-col items-center p-4">
          <TrendingUp className="h-5 w-5 text-primary" />
          <p className="mt-2 text-2xl font-display text-foreground">{progress}%</p>
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Progresso</p>
        </Card>
      </div>

      <Card className="mt-6 p-5">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Sua jornada</p>
        <p className="mt-2 font-display text-lg text-foreground">
          {completed === 0 && "Comece sua prática hoje 🌱"}
          {completed > 0 && completed < 7 && "Você está plantando a semente do hábito 🌿"}
          {completed >= 7 && completed < 21 && "Você está construindo consistência 🌸"}
          {completed >= 21 && completed < 28 && "Quase lá — continue firme ✨"}
          {completed === 28 && "Você completou os 28 dias 🎉"}
        </p>
      </Card>

      <Button
        onClick={handleLogout}
        variant="outline"
        className="mt-8 h-12 w-full rounded-full border-border"
      >
        <LogOut className="h-4 w-4" />
        Sair
      </Button>
    </div>
  );
}
