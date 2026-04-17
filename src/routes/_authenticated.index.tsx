import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Flame, Play, Check, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

type Day = { id: string; day_number: number; title: string };

function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("Praticante");
  const [days, setDays] = useState<Day[]>([]);
  const [completedSet, setCompletedSet] = useState<Set<string>>(new Set());
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: profile }, { data: ds }, { data: prog }, { data: st }] = await Promise.all([
        supabase.from("profiles").select("name").eq("id", user.id).maybeSingle(),
        supabase.from("days").select("id, day_number, title").order("day_number"),
        supabase.from("user_progress").select("day_id").eq("user_id", user.id).eq("completed", true),
        supabase.from("user_streak").select("current_streak").eq("user_id", user.id).maybeSingle(),
      ]);
      if (profile?.name) setName(profile.name);
      setDays(ds ?? []);
      setCompletedSet(new Set((prog ?? []).map((p) => p.day_id)));
      setStreak(st?.current_streak ?? 0);
      setLoading(false);
    })();
  }, [user]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const completedCount = days.filter((d) => completedSet.has(d.id)).length;
  const currentDay = days.find((d) => !completedSet.has(d.id)) ?? days[days.length - 1];
  const isAllDone = completedCount === 28;
  const currentWeek = currentDay ? Math.ceil(currentDay.day_number / 7) : 1;
  const weekDays = days.filter((d) => Math.ceil(d.day_number / 7) === currentWeek);

  return (
    <div className="px-5 pb-6 pt-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">Olá,</p>
          <h1 className="text-3xl font-display text-foreground">{name}</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-primary">
          <Flame className="h-4 w-4" />
          <span className="text-sm font-semibold">{streak}</span>
        </div>
      </div>

      {/* Progress card */}
      <Card className="mt-6 overflow-hidden border-0 bg-gradient-to-br from-primary to-[oklch(0.55_0.13_30)] p-6 text-primary-foreground shadow-md">
        <p className="text-xs uppercase tracking-widest opacity-80">Sua jornada</p>
        <p className="mt-2 text-4xl font-display">
          Dia {currentDay?.day_number ?? 28}
          <span className="text-xl opacity-70"> / 28</span>
        </p>
        <div className="mt-5">
          <Progress value={(completedCount / 28) * 100} className="h-2 bg-white/20" />
          <p className="mt-2 text-xs opacity-80">{completedCount} dias concluídos</p>
        </div>

        <Button
          onClick={() => currentDay && navigate({ to: "/day/$dayNumber", params: { dayNumber: String(currentDay.day_number) } })}
          disabled={isAllDone}
          className="mt-5 h-12 w-full rounded-full bg-white text-primary hover:bg-white/90"
        >
          <Play className="h-4 w-4 fill-primary" />
          {isAllDone ? "Programa concluído 🎉" : "Continuar prática"}
        </Button>
      </Card>

      {/* Week */}
      <div className="mt-8">
        <h2 className="text-sm font-semibold text-muted-foreground">Semana {currentWeek}</h2>
        <div className="mt-3 grid grid-cols-7 gap-1.5">
          {weekDays.map((d) => {
            const done = completedSet.has(d.id);
            const isCurrent = currentDay?.id === d.id;
            const locked = !done && !isCurrent;
            return (
              <Link
                key={d.id}
                to="/day/$dayNumber"
                params={{ dayNumber: String(d.day_number) }}
                disabled={locked}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center rounded-2xl text-xs font-medium transition-colors",
                  done && "bg-primary text-primary-foreground",
                  isCurrent && !done && "bg-accent text-accent-foreground ring-2 ring-primary",
                  locked && "bg-muted text-muted-foreground pointer-events-none",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : locked ? <Lock className="h-3.5 w-3.5" /> : d.day_number}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Today preview */}
      {currentDay && !isAllDone && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold text-muted-foreground">Sua prática de hoje</h2>
          <Link
            to="/day/$dayNumber"
            params={{ dayNumber: String(currentDay.day_number) }}
            className="mt-3 block"
          >
            <Card className="overflow-hidden border-border bg-card p-0 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex aspect-[16/9] items-center justify-center bg-gradient-to-br from-accent to-warm/40">
                <Play className="h-10 w-10 fill-primary-foreground text-primary-foreground/90" />
              </div>
              <div className="p-4">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">Dia {currentDay.day_number}</p>
                <p className="mt-1 font-display text-xl text-foreground">{currentDay.title.replace(/^Dia \d+ — /, "")}</p>
              </div>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
