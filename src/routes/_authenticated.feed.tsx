import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueries } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Sparkles, Calendar, ArrowRight, Clock } from "lucide-react";
import { getSignedWeekThumbnailUrl } from "@/lib/week-thumbnail.functions";

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
  const fetchThumb = useServerFn(getSignedWeekThumbnailUrl);

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

  const thumbQs = useQueries({
    queries: weeks.map((w) => ({
      queryKey: ["feed-week-thumb", w.id, w.thumbnail_url],
      enabled: !!w.thumbnail_url,
      queryFn: async () => {
        if (!w.thumbnail_url) return null;
        try {
          return await fetchThumb({ data: { thumbnailUrl: w.thumbnail_url } });
        } catch {
          return w.thumbnail_url;
        }
      },
      staleTime: 30 * 60_000,
    })),
  });

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
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                Sobre o programa
              </h2>
              <div className="relative flex items-center gap-2" id="weeks-carousel-nav" />
            </div>

            <Carousel
              opts={{ align: "start", loop: false }}
              className="-mx-5"
            >
              <CarouselContent className="ml-0 px-5">
                {weeks.map((w, i) => {
                  const thumb = thumbQs[i]?.data ?? w.thumbnail_url;
                  return (
                    <CarouselItem
                      key={w.id}
                      className="basis-full pl-0 pr-4"
                    >
                      <Card className="group relative overflow-hidden rounded-[32px] border-0 bg-black p-0 text-white shadow-none">
                        <div className="relative aspect-[3/4] w-full">
                          {thumb ? (
                            <img
                              src={thumb}
                              alt={w.title}
                              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/40 via-zinc-800 to-black" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

                          {/* top badges */}
                          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-5">
                            <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] backdrop-blur-md">
                              Semana {i + 1}
                            </span>
                            <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 text-[10px] font-semibold backdrop-blur-md">
                              <Clock className="h-3 w-3" />
                              {w.days.length * 5} min
                            </span>
                          </div>

                          {/* bottom content */}
                          <div className="absolute inset-x-0 bottom-0 p-6">
                            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.22em] text-primary">
                              <Calendar className="h-3 w-3" />
                              {w.days.length} dias de prática
                            </p>
                            <h3 className="mt-2 font-display text-3xl leading-tight">
                              {w.title}
                            </h3>
                            <Link
                              to="/"
                              className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-black transition hover:bg-white/90"
                            >
                              Acessar semana
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </div>
                        </div>
                      </Card>
                    </CarouselItem>
                  );
                })}
              </CarouselContent>
              <div className="mt-4 flex items-center justify-end gap-3 pr-5">
                <CarouselPrevious className="static translate-x-0 translate-y-0 h-11 w-11 border-border/40 bg-card hover:bg-muted" />
                <CarouselNext className="static translate-x-0 translate-y-0 h-11 w-11 border-border/40 bg-card hover:bg-muted" />
              </div>
            </Carousel>
          </div>

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
