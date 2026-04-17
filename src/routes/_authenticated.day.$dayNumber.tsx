import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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

type Movement = { id: string; title: string; description: string | null };
type Exercise = { id: string; title: string; movements: Movement[] };
type DayData = {
  id: string;
  day_number: number;
  title: string;
  video_url: string | null;
  respiration_text: string | null;
  reflection_text: string | null;
  exercises: Exercise[];
};

function DayPage() {
  const { dayNumber } = Route.useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [day, setDay] = useState<DayData | null>(null);
  const [completed, setCompleted] = useState(false);
  const [allowed, setAllowed] = useState(true);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user) return;
    const target = parseInt(dayNumber, 10);
    (async () => {
      // load day with exercises and movements
      const { data: dayRow } = await supabase
        .from("days")
        .select("id, day_number, title, video_url, respiration_text, reflection_text")
        .eq("day_number", target)
        .maybeSingle();

      if (!dayRow) {
        toast.error("Dia não encontrado");
        navigate({ to: "/" });
        return;
      }

      const { data: exs } = await supabase
        .from("exercises")
        .select("id, title, order_index, movements(id, title, description, order_index)")
        .eq("day_id", dayRow.id)
        .order("order_index");

      // Determine allowed: user must have completed all previous days
      const { data: prog } = await supabase
        .from("user_progress")
        .select("day_id, days!inner(day_number)")
        .eq("user_id", user.id)
        .eq("completed", true);
      const completedNumbers = new Set(
        (prog ?? []).map((p: { days: { day_number: number } | { day_number: number }[] }) => {
          const days = Array.isArray(p.days) ? p.days[0] : p.days;
          return days.day_number;
        }),
      );

      const isCompleted = completedNumbers.has(target);
      let firstAvailable = 1;
      for (let i = 1; i <= 28; i++) {
        if (!completedNumbers.has(i)) {
          firstAvailable = i;
          break;
        }
        if (i === 28) firstAvailable = 28;
      }
      const ok = target <= firstAvailable;

      setAllowed(ok);
      setCompleted(isCompleted);
      setDay({
        ...dayRow,
        exercises: (exs ?? []).map((e) => ({
          id: e.id,
          title: e.title,
          movements: ((e.movements as Movement[] | null) ?? []).sort(
            (a, b) => ((a as unknown as { order_index: number }).order_index) - ((b as unknown as { order_index: number }).order_index),
          ),
        })),
      });
      setLoading(false);

      if (!ok) {
        toast.error("Complete os dias anteriores primeiro");
        setTimeout(() => navigate({ to: "/" }), 600);
      }
    })();
  }, [dayNumber, user, navigate]);

  const handleComplete = async () => {
    if (!day || !user) return;
    setSubmitting(true);
    const { error } = await supabase.rpc("complete_day", { p_day_id: day.id });
    setSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
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
      {/* Video header */}
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

        {/* Exercises */}
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
                    <li key={m.id}>
                      <p className="text-sm font-medium text-foreground">{m.title}</p>
                      {m.description && (
                        <p className="mt-0.5 text-sm text-muted-foreground">{m.description}</p>
                      )}
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* Breathing */}
        {day.respiration_text && (
          <Card className="mt-6 border-0 bg-accent/40 p-5 shadow-none">
            <div className="flex items-center gap-2 text-primary">
              <Wind className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-widest">Respiração</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-foreground">{day.respiration_text}</p>
          </Card>
        )}

        {/* Reflection */}
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

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-1/2 z-30 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-background/95 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <Button
          onClick={handleComplete}
          disabled={submitting || completed}
          className="h-12 w-full rounded-full text-base"
        >
          {completed ? (
            <><Check className="h-4 w-4" /> Dia concluído</>
          ) : submitting ? "Salvando..." : "Concluir dia"}
        </Button>
      </div>
    </div>
  );
}
