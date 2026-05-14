import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
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
import { ArrowLeft, Wind, Sparkles, Check, Play, Volume2, VolumeX, Moon } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import DOMPurify from "dompurify";
import { AudioModulePlayer } from "@/components/AudioModulePlayer";
import { getPlayableDayAudioUrl } from "@/lib/day-audio.functions";

export const Route = createFileRoute("/_authenticated/day/$dayId")({
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
      <div className="pointer-events-none absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 bg-gradient-to-t from-black/60 to-transparent p-4">
        <div
          className="pointer-events-auto flex items-center gap-2"
          onMouseEnter={() => setShowVolume(true)}
          onMouseLeave={() => setShowVolume(false)}
        >
          <button
            type="button"
            onClick={toggleMute}
            aria-label={muted ? "Ativar som" : "Silenciar"}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white backdrop-blur-md transition-transform hover:scale-105 hover:bg-white/30"
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
      </div>
    </div>
  );
}

function DayPage() {
  const { dayId } = Route.useParams();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [activeVideo, setActiveVideo] = useState<{ url: string; title: string } | null>(null);
  const fetchPlayableAudio = useServerFn(getPlayableDayAudioUrl);

  const dayQ = useQuery({
    queryKey: ["day", dayId, user?.id],
    enabled: !authLoading && !!user,
    queryFn: async () => {
      const { data: dayRow, error } = await supabase
        .from("days")
        .select("id, day_number, title, video_url, audio_url, respiration_text, reflection_text, is_rest, week_id, weeks(title, order_index)")
        .eq("id", dayId)
        .maybeSingle();
      if (error) throw error;
      if (!dayRow) return null;

      let playableAudioUrl = dayRow.audio_url;

      if (dayRow.audio_url) {
        try {
          playableAudioUrl = await fetchPlayableAudio({
            data: { dayId: dayRow.id, audioUrl: dayRow.audio_url },
          });
        } catch (audioError) {
          console.error("Failed to resolve playable audio URL", audioError);
        }
      }

      const { data: exs } = await supabase
        .from("exercises")
        .select("id, title, order_index, movements(id, title, description, video_url, duration, order_index)")
        .eq("day_id", dayRow.id)
        .order("order_index");
      return {
        ...dayRow,
        audio_url: playableAudioUrl,
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
    queryKey: ["user_progress", user?.id],
    enabled: !authLoading && !!user,
    queryFn: async (): Promise<Set<string>> => {
      const { data } = await supabase
        .from("user_progress")
        .select("day_id")
        .eq("user_id", user!.id)
        .eq("completed", true);
      return new Set((data ?? []).map((p) => p.day_id));
    },
  });

  const weeksQ = useQuery({
    queryKey: ["weeks-order"],
    queryFn: async (): Promise<{ id: string; order_index: number }[]> => {
      const { data } = await supabase.from("weeks").select("id, order_index").order("order_index");
      return data ?? [];
    },
    staleTime: 10 * 60_000,
  });

  const loading = authLoading || dayQ.isLoading || progressQ.isLoading || weeksQ.isLoading;
  const day = dayQ.data;
  const weeks = weeksQ.data ?? [];
  const weekNumber = day?.week_id ? weeks.findIndex((w) => w.id === day.week_id) + 1 : 0;
  const completedSet = progressQ.data ?? new Set<string>();
  const isCompleted = day ? completedSet.has(day.id) : false;

  useEffect(() => {
    if (!loading && !day) {
      toast.error("Dia não encontrado");
      navigate({ to: "/" });
    }
  }, [loading, day, navigate]);

  const handleComplete = async () => {
    if (!day || !user) return;
    setSubmitting(true);
    if (isCompleted) {
      const { error } = await supabase
        .from("user_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("day_id", day.id);
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
      toast.success("Não concluído");
      return;
    }
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

  if (loading || !day) {
    return (
      <div className="pb-32">
        <Skeleton className="aspect-[4/5] w-full rounded-none" />
        <div className="px-5 pt-5 space-y-3">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="mt-6 h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
          <Skeleton className="h-12 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (day.is_rest) {
    return (
      <div className="min-h-[100vh] bg-gradient-to-b from-accent/30 via-background to-background pb-32">
        <button
          onClick={() => navigate({ to: "/" })}
          className="absolute left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex flex-col items-center px-6 pt-24 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Moon className="h-9 w-9" strokeWidth={1.5} />
          </div>
          <p className="mt-6 text-[10px] uppercase tracking-[0.22em] text-muted-foreground">
            Dia {day.day_number} · Descanso
          </p>
          <h1 className="mt-2 font-display text-3xl leading-tight text-foreground">
            Hoje é dia de pausa
          </h1>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            O descanso faz parte do protocolo. Deixe os músculos da face relaxarem,
            beba bastante água e respire fundo. Amanhã retomamos a prática.
          </p>

          <div className="mt-10 w-full max-w-sm space-y-3">
            <Card className="border-0 bg-accent/40 p-5 text-left shadow-none">
              <div className="flex items-center gap-2 text-primary">
                <Wind className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-widest">Sugestão</p>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-foreground">
                3 minutos de respiração consciente: inspire por 4s, segure 4s, solte por 6s.
              </p>
            </Card>
            <Card className="border-0 bg-warm/20 p-5 text-left shadow-none">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-4 w-4" />
                <p className="text-xs font-semibold uppercase tracking-widest">Lembrete</p>
              </div>
              <p className="mt-2 font-display text-base leading-snug text-foreground">
                Pausa também é autocuidado.
              </p>
            </Card>
          </div>

          <Button
            onClick={handleComplete}
            disabled={submitting}
            className="mt-8 h-12 w-full max-w-sm rounded-full text-base"
          >
            {submitting
              ? "Salvando..."
              : isCompleted
                ? (<><Check className="h-4 w-4" /> Marcado</>)
                : "Marcar descanso"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="pb-32">
      <div className="relative">
        <AudioModulePlayer audioUrl={day.audio_url ?? null} />
        <button
          onClick={() => navigate({ to: "/" })}
          className="absolute left-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-background/80 backdrop-blur"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      <div className="px-5 pt-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Dia {day.day_number}
        </p>
        <h1 className="mt-1 font-display text-2xl leading-tight text-foreground">
          {(day as { weeks?: { title?: string } }).weeks?.title ?? day.title.replace(/^Dia \d+ — /, "")}
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
                <ol className="space-y-3 pb-2">
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
                            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm transition-transform hover:bg-primary hover:scale-105 active:scale-95"
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
                                dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(m.description) }}
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
            disabled={submitting}
            className="h-12 w-full rounded-full text-base"
          >
            {submitting
              ? "Salvando..."
              : isCompleted
                ? (<><Check className="h-4 w-4" /> Concluído</>)
                : "Concluir dia"}
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
        <DialogContent className="w-[min(92vw,420px)] overflow-hidden rounded-sm border-0 bg-black p-0 sm:rounded-sm">
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
