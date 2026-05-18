import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Heart, Flower2 } from "lucide-react";
import { Logo } from "@/components/Logo";
import { CONTACT_EMAIL } from "@/lib/legal-versions";
import { RouteError } from "@/components/RouteError";
import { RouteNotFound } from "@/components/RouteNotFound";

export const Route = createFileRoute("/sobre")({
  head: () => ({
    meta: [
      { title: "Sobre — Yuna Skin" },
      {
        name: "description",
        content:
          "Yuna Skin: autocuidado facial guiado em poucos minutos por dia. Leveza, glow e feminilidade através de uma rotina elegante e natural.",
      },
      { property: "og:title", content: "Sobre — Yuna Skin" },
      {
        property: "og:description",
        content:
          "Sua rotina de beleza natural em poucos minutos por dia. Autocuidado facial guiado para mulheres que querem se sentir bonitas novamente.",
      },
      { property: "og:url", content: "https://yuna-flow.lovable.app/sobre" },
    ],
    links: [{ rel: "canonical", href: "https://yuna-flow.lovable.app/sobre" }],
  }),
  component: SobrePage,
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
});

function SobrePage() {
  return (
    <div className="mobile-shell px-6 py-8 pb-20">
      <Link
        to="/auth"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <header className="mt-8">
        <Logo size={64} />
        <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
          Yuna Skin
        </p>
        <h1 className="mt-2 font-display text-4xl leading-tight text-foreground">
          Sua rotina de beleza natural em poucos minutos por dia
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          Autocuidado facial guiado para mulheres que querem se sentir bonitas
          novamente. Leveza, glow e feminilidade através de uma rotina facial
          elegante e natural.
        </p>
      </header>

      <section className="mt-10 space-y-4">
        <div className="rounded-3xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500/20 to-rose-500/5 text-rose-600">
            <Flower2 className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h2 className="mt-4 font-display text-xl text-foreground">
            Inspirado no ritual coreano
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Movimentos de yoga facial, drenagem e massagem reunidos em sessões
            curtas e guiadas, pensadas pra caber em qualquer rotina.
          </p>
        </div>

        <div className="rounded-3xl border border-border/40 bg-card/60 p-6 backdrop-blur-sm">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 text-violet-600">
            <Heart className="h-6 w-6" strokeWidth={1.75} />
          </div>
          <h2 className="mt-4 font-display text-xl text-foreground">
            Feito pra mulheres reais
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Sem promessas milagrosas. Um espaço pra reencontrar o cuidado com
            você mesma, na sua casa, no seu tempo.
          </p>
        </div>
      </section>

      <section className="mt-10 rounded-3xl bg-gradient-to-br from-primary/10 to-primary/5 p-6">
        <h2 className="font-display text-lg text-foreground">Fale com a gente</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Dúvidas, sugestões ou suporte? Estamos pra te ouvir.
        </p>
        <a
          href={`mailto:${CONTACT_EMAIL}`}
          className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          {CONTACT_EMAIL}
        </a>
      </section>

      <footer className="mt-10 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        <Link to="/termos-de-uso" className="hover:text-foreground hover:underline">
          Termos de Uso
        </Link>
        <Link to="/politica-de-privacidade" className="hover:text-foreground hover:underline">
          Privacidade
        </Link>
        <Link to="/politica-de-cookies" className="hover:text-foreground hover:underline">
          Cookies
        </Link>
        <Link to="/reembolso" className="hover:text-foreground hover:underline">
          Reembolso
        </Link>
      </footer>
    </div>
  );
}
