import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, Play, Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

type Day = { id: string; day_number: number; title: string };
type Week = { id: string; title: string; order_index: number; days: Day[] };

function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userId = user?.id;
  const [selectedWeekId, setSelectedWeekId] = useState<string | null>(null);

  const weeksQ = useQuery({
    queryKey: ["weeks-with-days"],
    queryFn: async (): Promise<Week[]> => {
      const { data, error } = await supabase
        .from("weeks")
        .select("id, title, order_index, days(id, day_number, title)")
        .order("order_index", { ascending: true })
        .order("day_number", { foreignTable: "days", ascending: true });
      if (error) throw error;
      return (data ?? []) as Week[];
    },
    staleTime: 10 * 60_000,
  });

  const profileQ = useQuery({
    queryKey: ["profile", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("name").eq("id", userId!).maybeSingle();
      return data?.name ?? "Praticante";
    },
  });

  const progressQ = useQuery({
    queryKey: ["user_progress", userId],
    enabled: !!userId,
    queryFn: async (): Promise<Set<string>> => {
      const { data } = await supabase
        .from("user_progress")
        .select("day_id")
        .eq("user_id", userId!)
        .eq("completed", true);
      return new Set((data ?? []).map((p) => p.day_id));
    },
  });

  const streakQ = useQuery({
    queryKey: ["user_streak", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_streak")
        .select("current_streak")
        .eq("user_id", userId!)
        .maybeSingle();
      return data?.current_streak ?? 0;
    },
  });

  const loading = weeksQ.isLoading || profileQ.isLoading || progressQ.isLoading;

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const weeks = weeksQ.data ?? [];
  const allDays = weeks.flatMap((w) => w.days);
  const totalDays = allDays.length;
  const completedSet = progressQ.data ?? new Set<string>();
  const name = profileQ.data ?? "Praticante";
  const streak = streakQ.data ?? 0;

  const completedCount = allDays.filter((d) => completedSet.has(d.id)).length;
  const currentDay = allDays.find((d) => !completedSet.has(d.id)) ?? allDays[allDays.length - 1];
  const isAllDone = totalDays > 0 && completedCount === totalDays;

  const currentWeek = weeks.find((w) => w.days.some((d) => d.id === currentDay?.id)) ?? weeks[0];
  const currentWeekIndex = currentWeek ? weeks.indexOf(currentWeek) : 0;
  const activeWeek = weeks.find((w) => w.id === selectedWeekId) ?? currentWeek;
  const activeWeekIndex = activeWeek ? weeks.indexOf(activeWeek) : 0;
  const weekDays = activeWeek?.days ?? [];

  return (
    <div className="px-4 pb-6 pt-8">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Olá,</p>
          <h1 className="mt-1 font-display text-[28px] leading-tight text-foreground">{name}</h1>
        </div>
        <div className="flex items-center gap-1.5 rounded-full glass border border-black/5 px-3 py-1.5">
          <Flame className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">{streak}</span>
        </div>
      </div>

      <Card className="mt-6 overflow-hidden border-0 bg-cta-dark p-5 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] opacity-70">Sua jornada</p>
            <p className="mt-2 font-display text-4xl">
              Dia {currentDay?.day_number ?? totalDays}
              <span className="text-xl opacity-60"> / {totalDays}</span>
            </p>
          </div>
          <div className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium">
            Semana {currentWeekIndex + 1}
          </div>
        </div>
        <div className="mt-5">
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-white/15">
            <div
              className="h-full bg-progress-accent rounded-full transition-all duration-500"
              style={{ width: `${totalDays ? (completedCount / totalDays) * 100 : 0}%` }}
            />
          </div>
          <p className="mt-2 text-xs opacity-70">{completedCount} dias concluídos</p>
        </div>

        <Button
          onClick={() => currentDay && navigate({ to: "/day/$dayId", params: { dayId: currentDay.id } })}
          disabled={isAllDone}
          variant="primary"
          size="lg"
          className="mt-5 w-full bg-white text-foreground hover:bg-white/95 hover:brightness-100"
        >
          <Play className="h-4 w-4 fill-foreground" />
          {isAllDone ? "Programa concluído 🎉" : "Continuar prática"}
        </Button>
      </Card>

      <div className="mt-7">
        <div className="flex items-center justify-between gap-3">
          <Select value={activeWeek?.id ?? ""} onValueChange={(v) => setSelectedWeekId(v)}>
            <SelectTrigger className="h-9 w-auto min-w-[140px] gap-2 rounded-full border-black/10 bg-white text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {weeks.map((w, i) => (
                <SelectItem key={w.id} value={w.id}>{w.title || `Semana ${i + 1}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-[11px] text-muted-foreground">{weekDays.length} dias</span>
        </div>
        <div className="mt-3 grid gap-2" style={{ gridTemplateColumns: `repeat(${weekDays.length}, minmax(0, 1fr))` }}>
          {weekDays.map((d) => {
            const done = completedSet.has(d.id);
            const isCurrent = currentDay?.id === d.id;
            return (
              <Link
                key={d.id}
                to="/day/$dayId"
                params={{ dayId: d.id }}
                className={cn(
                  "flex aspect-square w-full items-center justify-center rounded-full text-sm font-semibold transition-all",
                  done
                    ? "bg-progress-accent text-white shadow-sm"
                    : isCurrent
                      ? "glass border-2 border-primary text-foreground"
                      : "bg-white/60 text-muted-foreground border border-black/[0.04] hover:bg-white",
                )}
              >
                {done ? <Check className="h-4 w-4" strokeWidth={2.5} /> : d.day_number}
              </Link>
            );
          })}
        </div>
      </div>

      {currentDay && !isAllDone && (
        <div className="mt-7">
          <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
            Sua prática de hoje
          </h2>
          <Link to="/day/$dayId" params={{ dayId: currentDay.id }} className="mt-3 block">
            <Card className="overflow-hidden p-0 transition-all hover:shadow-md active:scale-[0.99]">
              <div className="relative flex aspect-[16/9] items-center justify-center bg-primary-soft">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/95 shadow-md">
                  <Play className="h-5 w-5 fill-foreground text-foreground ml-0.5" />
                </div>
              </div>
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Dia {currentDay.day_number}
                </p>
                <p className="mt-1 font-display text-lg leading-snug text-foreground">
                  {currentDay.title.replace(/^Dia \d+ — /, "")}
                </p>
              </div>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
