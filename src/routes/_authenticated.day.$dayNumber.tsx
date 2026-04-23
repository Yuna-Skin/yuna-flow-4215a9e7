import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowLeft, Wind, Sparkles, Check, Play, Pause, Volume2, VolumeX } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/day/$dayNumber")({
  component: DayPage,
});

type Movement = { id: string; title: string; description: string | null; video_url: string | null; duration: string | null; order_index: number };
type ExerciseRow = { id: string; title: string; order_index: number; movements: Movement[] | null };

function MinimalVideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [showVolume, setShowVolume] = useState(false);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); } else { v.pause(); setPlaying(false); }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  const onVolume = (val: number) => {
    const v = videoRef.current;
    if (!v) return;
    v.volume = val;
    v.muted = val === 0;
    setVolume(val);
    setMuted(val === 0);
  };

  return (
    <div className="relative">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        playsInline
        onClick={togglePlay}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        className="aspect-[9/16] w-full bg-black object-cover"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-black/60 to-transparent p-4">
        <div
          className="pointer-events-auto flex items-center gap-2"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
        >
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Ativar som" : "Silenciar"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-foreground shadow-md transition-transform hover:scale-105"
          >
            {muted || volume === 0 ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
          {showVolume && (
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={muted ? 0 : volume}
              onChange={(e) => onVolume(parseFloat(e.target.value))}
              className="h-1 w-24 cursor-pointer accent-primary"
            />
          )}
        </div>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? "Pausar" : "Reproduzir"}
          className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-md transition-transform hover:scale-105"
        >
          {playing ? <Pause className="h-5 w-5 fill-current" /> : <Play className="h-5 w-5 fill-current" />}
        </button>
      </div>
    </div>
  );
}

function DayPage() {
  const { dayNumber } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);
  const target = parseInt(dayNumber, 10);

  const dayQ = useQuery({
    queryKey: ["day", target],
    queryFn: async () => {
      const { data: dayRow, error } = await supabase
        .from("days")
        .select("id, day_number, title, video_url, respiration_text, reflection_text")
        .eq("day_number", target)
        .maybeSingle();
      if (error) throw error;
      if (!dayRow) return null;
      const { data: exs } = await supabase
        .from("exercises")
        .select("id, title, order_index, movements(id, title, description, video_url, duration, order_index)")
        .eq("day_id", dayRow.id)
        .order("order_index");
      return {
        ...dayRow,
        exercises: ((exs as ExerciseRow[] | null) ?? []).map((e) => ({
          id: e.id,
          title: e.title,
          movements: (e.movements ?? []).slice().sort((a, b) => a.order_index - b.order_index),
        })),
      };
    },
    staleTime: 10 * 60_000,
  });

  const progressQ = useQuery({
    queryKey: ["user_progress_full", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<Set<number>> => {
      const { data } = await supabase
        .from("user_progress")
        .select("days!inner(day_number)")
        .eq("user_id", user!.id)
        .eq("completed", true);
      return new Set(
        (data ?? []).map((p: { days: { day_number: number } | { day_number: number }[] }) => {
          const days = Array.isArray(p.days) ? p.days[0] : p.days;
          return days.day_number;
        }),
      );
    },
  });

  const loading = dayQ.isLoading || progressQ.isLoading;
  const day = dayQ.data;
  const completedNumbers = progressQ.data ?? new Set<number>();

  const isCompleted = completedNumbers.has(target);
  let firstAvailable = 28;
  for (let i = 1; i <= 28; i++) {
    if (!completedNumbers.has(i)) { firstAvailable = i; break; }
  }
  const allowed = target <= firstAvailable;

  useEffect(() => {
    if (!loading && !allowed) {
      toast.error("Complete os dias anteriores primeiro");
      navigate({ to: "/" });
    }
  }, [loading, allowed, navigate]);

  const handleComplete = async () => {
    if (!day) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("complete_day", { p_day_id: day.id });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["user_progress"] }),
      queryClient.invalidateQueries({ queryKey: ["user_progress_full"] }),
      queryClient.invalidateQueries({ queryKey: ["user_streak"] }),
    ]);
    toast.success("Dia concluído! 🌸");
    navigate({ to: "/" });
  };

  if (loading || !day || !allowed) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="pb-32">
      <div className="relative">
        <div className="aspect-[16/10] w-full overflow-hidden bg-black">
          {day.video_url ? (
            <iframe
              src={day.video_url}
              className="h-full w-full"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title={day.title}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white/60">Sem vídeo</div>
          )}
        </div>
        <button
          onClick={() => navigate({ to: "/" })}
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="px-5 pt-5">
        <p className="text-xs uppercase tracking-widest text-primary">Dia {day.day_number}</p>
        <h1 className="mt-1 font-display text-3xl text-foreground">
          {day.title.replace(/^Dia \d+ — /, "")}
        </h1>

        <h2 className="mt-7 text-sm font-semibold text-muted-foreground">Exercícios</h2>
        <Accordion type="multiple" className="mt-2">
          {day.exercises.map((ex, idx) => (
            <AccordionItem key={ex.id} value={ex.id} className="border-b border-border">
              <AccordionTrigger className="group py-4 text-left no-underline hover:no-underline [&>svg]:transition-transform">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                    {idx + 1}
                  </span>
                  <span className="font-medium transition-colors group-hover:text-primary">{ex.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ol className="ml-11 space-y-3 pb-2">
                  {ex.movements.map((m, mIdx) => (
                    <li key={m.id} className="overflow-hidden rounded-2xl border border-border/60 bg-card/60">
                      <div className="flex items-start justify-between gap-3 p-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                              Movimento {mIdx + 1}
                            </span>
                            {m.duration && (
                              <>
                                <span className="text-muted-foreground/40">·</span>
                                <span className="text-[11px] font-semibold uppercase tracking-widest text-primary">
                                  {m.duration}
                                </span>
                              </>
                            )}
                          </div>
                          <p className="mt-1 font-display text-lg leading-tight text-foreground">
                            {m.title}
                          </p>
                        </div>
                        {m.video_url && (
                          <button
                            type="button"
                            onClick={() => setActiveVideo({ url: m.video_url!, title: m.title })}
                            aria-label={`Ver vídeo de ${m.title}`}
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:bg-primary/90 hover:scale-105 active:scale-95"
                          >
                            <Play className="h-4 w-4 fill-current" />
                          </button>
                        )}
                      </div>
                      {m.description && (
                        <Accordion type="single" collapsible className="border-t border-border/60">
                          <AccordionItem value={`desc-${m.id}`} className="border-0">
                            <AccordionTrigger className="px-4 py-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground no-underline hover:no-underline hover:text-foreground">
                              Descrição
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div
                                className="prose prose-sm max-w-none text-sm leading-relaxed text-muted-foreground prose-p:my-1.5 prose-strong:font-semibold prose-strong:text-foreground prose-headings:mt-3 prose-headings:mb-1 prose-headings:text-xs prose-headings:font-semibold prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-foreground/80 prose-ul:my-1.5 prose-ol:my-1.5 prose-li:my-0.5"
                                dangerouslySetInnerHTML={{ __html: m.description }}
                              />
                            </AccordionContent>
                          </AccordionItem>
                        </Accordion>
                      )}
                    </li>
                  ))}
                </ol>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        <div className="mt-6">
          <Button
            onClick={handleComplete}
            disabled={submitting || isCompleted}
            className="h-12 w-full rounded-full text-base"
          >
            {isCompleted ? (
              <><Check className="h-4 w-4" /> Dia concluído</>
            ) : submitting ? "Salvando..." : "Concluir dia"}
          </Button>
        </div>

        {day.respiration_text && (
          <Card className="mt-6 border-0 bg-accent/40 p-5 shadow-none">
            <div className="flex items-center gap-2 text-primary">
              <Wind className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-widest">Respiração</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{day.respiration_text}</p>
          </Card>
        )}

        {day.reflection_text && (
          <Card className="mt-4 border-0 bg-warm/20 p-5 shadow-none">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-widest">Reflexão</p>
            </div>
            <p className="mt-2 font-display text-lg leading-snug text-foreground">
              {day.reflection_text}
            </p>
          </Card>
        )}
      </div>

      <Dialog open={!!activeVideo} onOpenChange={(o) => !o && setActiveVideo(null)}>
        <DialogContent className="w-[min(92vw,420px)] overflow-hidden border-0 bg-black p-0 sm:rounded-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{activeVideo?.title ?? "Vídeo"}</DialogTitle>
          </DialogHeader>
          {activeVideo && (
            /\.(mp4|webm|mov)(\?|$)/i.test(activeVideo.url) ? (
              <MinimalVideoPlayer key={activeVideo.url} src={activeVideo.url} />
            ) : (
              <iframe
                key={activeVideo.url}
                src={activeVideo.url}
                className="aspect-[9/16] w-full bg-black"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
                title={activeVideo.title}
              />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
