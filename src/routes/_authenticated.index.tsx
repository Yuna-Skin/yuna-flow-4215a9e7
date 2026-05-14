import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Flame, Play, Pause, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { getPlayableDayAudioUrl } from "@/lib/day-audio.functions";
import { getSignedWeekThumbnailUrl } from "@/lib/week-thumbnail.functions";

export const Route = createFileRoute("/_authenticated/")({
  component: HomePage,
});

type Day = { id: string; day_number: number; title: string; audio_url: string | null };
type Week = { id: string; title: string; order_index: number; thumbnail_url: string | null; days: Day[] };

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
        .select("id, title, order_index, thumbnail_url, days(id, day_number, title, audio_url)")
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

  const fetchPlayableAudio = useServerFn(getPlayableDayAudioUrl);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const audioQ = useQuery({
    queryKey: ["day-playable-audio", currentDay?.id],
    enabled: !!currentDay?.audio_url,
    queryFn: async () => {
      if (!currentDay?.audio_url) return null;
      try {
        return await fetchPlayableAudio({
          data: { dayId: currentDay.id, audioUrl: currentDay.audio_url },
        });
      } catch (e) {
        console.error("Failed to resolve audio", e);
        return currentDay.audio_url;
      }
    },
    staleTime: 30 * 60_000,
  });

  const fetchThumb = useServerFn(getSignedWeekThumbnailUrl);
  const thumbQ = useQuery({
    queryKey: ["week-thumb", activeWeek?.id, activeWeek?.thumbnail_url],
    enabled: !!activeWeek?.thumbnail_url,
    queryFn: async () => {
      if (!activeWeek?.thumbnail_url) return null;
      try {
        return await fetchThumb({ data: { thumbnailUrl: activeWeek.thumbnail_url } });
      } catch (e) {
        console.error("Failed to sign thumbnail", e);
        return activeWeek.thumbnail_url;
      }
    },
    staleTime: 30 * 60_000,
  });

  const activeWeekCompleted = weekDays.filter((d) => completedSet.has(d.id)).length;
  const activeWeekTotal = weekDays.length;
  const activeWeekTargetDay =
    weekDays.find((d) => !completedSet.has(d.id)) ?? weekDays[0] ?? null;
  const activeWeekProgressPct = activeWeekTotal
    ? Math.round((activeWeekCompleted / activeWeekTotal) * 100)
    : 0;
  const activeWeekDone = activeWeekTotal > 0 && activeWeekCompleted === activeWeekTotal;

  useEffect(() => {
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  }, [currentDay?.id]);

  const loading = weeksQ.isLoading || profileQ.isLoading || progressQ.isLoading;

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const togglePlay = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play().then(() => setIsPlaying(true)).catch((err) => console.error(err));
    } else {
      a.pause();
      setIsPlaying(false);
    }
  };

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

      <Card className="relative mt-6 h-[440px] overflow-hidden rounded-[40px] border-0 bg-black p-0 text-white shadow-2xl">
        {thumbQ.data ? (
          <img
            src={thumbQ.data}
            alt={activeWeek?.title ?? "Semana"}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent" />

        <div className="relative flex h-full flex-col justify-between p-7">
          <div className="flex gap-2">
            <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-xl">
              <p className="text-[10px] font-bold uppercase tracking-widest text-white">
                Semana {activeWeekIndex + 1}
              </p>
            </div>
            {activeWeekTargetDay && (
              <div className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-xl">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white">
                  Dia {activeWeekTargetDay.day_number}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="space-y-1.5">
              <span className="block text-[11px] font-bold uppercase tracking-[0.25em] text-primary">
                {activeWeek?.title ?? "Sua jornada"}
              </span>
              <h1 className="font-display text-4xl leading-[1.1] tracking-tight text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.6)]">
                {activeWeekTargetDay?.title ?? activeWeek?.title ?? "Sua jornada"}
              </h1>
            </div>

            <div className="space-y-3">
              <div className="flex items-end justify-between font-medium text-white/70">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-bold text-white">{activeWeekCompleted}</span>
                  <span className="text-xs">/ {activeWeekTotal} dias</span>
                </div>
                <span className="text-xs uppercase tracking-wider">
                  {activeWeekProgressPct}% concluído
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10 backdrop-blur-sm">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-orange-400 to-orange-600 shadow-[0_0_15px_rgba(249,115,22,0.4)] transition-all duration-1000"
                  style={{ width: `${activeWeekProgressPct}%` }}
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                activeWeekTargetDay &&
                navigate({ to: "/day/$dayId", params: { dayId: activeWeekTargetDay.id } })
              }
              disabled={activeWeekDone || !activeWeekTargetDay}
              className="group/btn flex h-14 w-full items-center justify-center gap-3 rounded-2xl bg-white transition-all duration-300 hover:bg-zinc-100 active:scale-[0.98] disabled:opacity-60"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 transition-transform group-hover/btn:scale-110">
                <Play className="h-2.5 w-2.5 translate-x-[1px] fill-white text-white" strokeWidth={0} />
              </div>
              <span className="text-base font-bold tracking-tight text-zinc-900">
                {activeWeekDone
                  ? "Semana concluída"
                  : activeWeek?.id === currentWeek?.id
                    ? "Continuar"
                    : "Começar semana"}
              </span>
            </button>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 rounded-[40px] border border-white/10" />
      </Card>

      <div className="mt-7">
        <div className="flex items-center justify-between gap-3">
          <Select value={activeWeek?.id ?? ""} onValueChange={(v) => setSelectedWeekId(v)}>
            <SelectTrigger className="h-9 w-auto min-w-[140px] gap-2 rounded-full border-black/10 bg-white text-[13px] font-semibold uppercase tracking-wider text-muted-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {weeks.map((w, i) => (
                <SelectItem key={w.id} value={w.id}>Semana {i + 1}</SelectItem>
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
              <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-zinc-900 via-zinc-800 to-black">
                <video
                  src="/ambient-loop.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 h-full w-full scale-105 object-cover"
                />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,rgba(0,0,0,0.55)_100%)]" />
                <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                {audioQ.data && (
                  <audio
                    ref={audioRef}
                    src={audioQ.data}
                    preload="metadata"
                    onEnded={() => setIsPlaying(false)}
                    onPause={() => setIsPlaying(false)}
                    onPlay={() => setIsPlaying(true)}
                  />
                )}
                <button
                  type="button"
                  onClick={togglePlay}
                  disabled={!audioQ.data}
                  aria-label={isPlaying ? "Pausar áudio" : "Reproduzir áudio"}
                  className="absolute inset-0 z-10 flex items-center justify-center transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {isPlaying ? (
                    <Pause
                      className="h-16 w-16 fill-white text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.55)]"
                      strokeWidth={0}
                    />
                  ) : (
                    <Play
                      className="ml-1 h-16 w-16 fill-white text-white drop-shadow-[0_6px_20px_rgba(0,0,0,0.55)]"
                      strokeWidth={0}
                    />
                  )}
                </button>
                <div className="absolute inset-x-0 bottom-0 px-6 pb-5">
                  <div className="flex h-12 items-center justify-center gap-[3px]" aria-hidden>
                    {Array.from({ length: 56 }).map((_, i) => {
                      const edge = Math.sin((i / 55) * Math.PI);
                      const wave = Math.sin(i * 0.45) * 0.5 + 0.5;
                      const h = 0.1 + wave * 0.5 * edge;
                      return (
                        <span
                          key={i}
                          className="w-[2.5px] rounded-full bg-white/55"
                          style={{ height: `${Math.max(8, Math.round(h * 100))}%` }}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
                  Dia {currentDay.day_number}
                </p>
                <p className="mt-1 font-display text-2xl leading-tight text-foreground">
                  {currentDay.title ?? currentWeek?.title ?? ""}
                </p>
              </div>
            </Card>
          </Link>
        </div>
      )}
    </div>
  );
}
