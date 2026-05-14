import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Sparkles, Calendar, ArrowRight, Clock } from "lucide-react";

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
        <section className="mt-8 space-y-8">
          {/* Featured / Hero week (first one) */}
          {weeks[0] && (
            <div>
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Comece por aqui
              </h2>
              <Card className="group relative overflow-hidden rounded-3xl border-0 bg-black p-0 text-white shadow-xl">
                <div className="relative aspect-[4/5] w-full sm:aspect-[16/10]">
                  {weeks[0].thumbnail_url ? (
                    <img
                      src={weeks[0].thumbnail_url}
                      alt={weeks[0].title}
                      className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-zinc-800 to-black" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent" />
                  <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
                    <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-md">
                      Em destaque
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold backdrop-blur-md">
                      <Clock className="h-3 w-3" />
                      {weeks[0].days.length * 5} min
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                      Semana 1 · {weeks[0].days.length} dias
                    </p>
                    <h3 className="mt-2 font-display text-3xl leading-tight">
                      {weeks[0].title}
                    </h3>
                    <p className="mt-2 max-w-md text-sm text-white/70">
                      Inicie sua jornada com práticas guiadas para preparar o rosto.
                    </p>
                    <Link
                      to="/"
                      className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black transition hover:bg-white/90"
                    >
                      Começar agora
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Other weeks */}
          {weeks.length > 1 && (
            <div>
              <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Próximas semanas
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {weeks.slice(1).map((w, i) => (
                  <Card
                    key={w.id}
                    className="group relative overflow-hidden rounded-2xl border-0 bg-black p-0 text-white shadow-md transition-transform duration-500 hover:-translate-y-1"
                  >
                    <div className="relative aspect-[16/10] w-full">
                      {w.thumbnail_url ? (
                        <img
                          src={w.thumbnail_url}
                          alt={w.title}
                          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-zinc-700 to-black" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                      <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-semibold backdrop-blur-md">
                        <Calendar className="h-3 w-3" />
                        {w.days.length} dias
                      </div>
                      <div className="absolute inset-x-0 bottom-0 p-4">
                        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                          Semana {i + 2}
                        </p>
                        <h3 className="mt-1 font-display text-xl leading-tight">
                          {w.title}
                        </h3>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Tips section */}
          <div>
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
              Dicas para aproveitar
            </h2>
            <div className="space-y-3">
              {[
                {
                  title: "Constância acima de intensidade",
                  text: "Práticas curtas todos os dias trazem mais resultado que sessões longas esporádicas.",
                },
                {
                  title: "Respire antes de começar",
                  text: "Três respirações profundas relaxam a musculatura e potencializam cada movimento.",
                },
                {
                  title: "Hidrate a pele",
                  text: "Aplique seu sérum ou óleo favorito antes da prática para deslizar melhor.",
                },
              ].map((tip, i) => (
                <Card
                  key={i}
                  className="rounded-2xl border border-border/40 bg-card/60 p-4 backdrop-blur-sm"
                >
                  <div className="flex gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-display text-base text-foreground">
                        {tip.title}
                      </h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {tip.text}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
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
