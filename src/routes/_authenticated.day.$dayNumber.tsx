import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { ArrowLeft, Wind, Sparkles, Check } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/day/$dayNumber")({
  component: DayPage,
});

type Movement = { id: string; title: string; description: string | null; video_url: string | null; order_index: number };
type ExerciseRow = { id: string; title: string; order_index: number; movements: Movement[] | null };

function DayPage() {
  const { dayNumber } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
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
        .select("id, title, order_index, movements(id, title, description, video_url, order_index)")
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
              <AccordionTrigger className="py-4 text-left">
                <div className="flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                    {idx + 1}
                  </span>
                  <span className="font-medium">{ex.title}</span>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <ul className="ml-11 space-y-3 pb-2">
                  {ex.movements.map((m) => (
                    <li key={m.id} className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-foreground">{m.title}</p>
                        {m.description && (
                          <p className="mt-0.5 text-sm text-muted-foreground">{m.description}</p>
                        )}
                      </div>
                      {m.video_url && (
                        <div className="overflow-hidden rounded-xl border border-border bg-black">
                          {/\.(mp4|webm|mov)(\?|$)/i.test(m.video_url) ? (
                            <video
                              src={m.video_url}
                              controls
                              playsInline
                              preload="metadata"
                              className="aspect-video w-full"
                            />
                          ) : (
                            <iframe
                              src={m.video_url}
                              className="aspect-video w-full"
                              allow="autoplay; encrypted-media; picture-in-picture"
                              allowFullScreen
                              title={m.title}
                            />
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

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

      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-background/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
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
    </div>
  );
}
