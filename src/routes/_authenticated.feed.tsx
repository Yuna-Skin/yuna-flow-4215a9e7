import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

export const Route = createFileRoute("/_authenticated/feed")({
  component: FeedPage,
});

type Week = {
  id: string;
  title: string;
  order_index: number;
  thumbnail_url: string | null;
  days: { id: string }[];
};

function FeedPage() {
  const weeksQ = useQuery({
    queryKey: ["feed-weeks"],
    queryFn: async (): Promise<Week[]> => {
      const { data } = await supabase
        .from("weeks")
        .select("id, title, order_index, thumbnail_url, days(id)")
        .order("order_index", { ascending: true });
      return (data ?? []) as Week[];
    },
    staleTime: 10 * 60_000,
  });

  const items = itemsQ.data ?? [];
  const weeks = weeksQ.data ?? [];

  return (
    <div className="px-5 pb-10 pt-8">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
          Conteúdo
        </p>
      </div>
      <h1 className="mt-2 font-display text-3xl leading-tight text-foreground">
        Dicas & jornada
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Aprenda mais sobre o programa e cada semana de prática
      </p>

      {weeks.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
            Sobre o programa
          </h2>
          <div className="mt-3 space-y-3">
            {weeks.map((w, i) => (
              <Card
                key={w.id}
                className="relative overflow-hidden rounded-2xl border-0 bg-black p-0 text-white shadow-md"
              >
                {w.thumbnail_url ? (
                  <img
                    src={w.thumbnail_url}
                    alt={w.title}
                    className="absolute inset-0 h-full w-full object-cover opacity-70"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent" />
                <div className="relative flex min-h-[120px] flex-col justify-center p-5">
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                    Semana {i + 1} · {w.days.length} dias
                  </p>
                  <h3 className="mt-1 font-display text-2xl leading-tight">
                    {w.title}
                  </h3>
                </div>
              </Card>
            ))}
          </div>
        </section>
      )}

      {weeks.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Nenhum conteúdo disponível ainda.
        </p>
      )}
    </div>
  );
}
