import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Sparkles, BookOpen, Download, Lock, Headphones, FileText, ArrowUpRight } from "lucide-react";
import { RouteError } from "@/components/RouteError";
import { RouteNotFound } from "@/components/RouteNotFound";

export const Route = createFileRoute("/_authenticated/plus")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  component: PlusPage,
});

type BonusKind = "ebook" | "audio" | "pdf" | "guide";

type BonusItem = {
  id: string;
  kind: BonusKind;
  title: string;
  description: string;
  meta: string;
  url?: string;
  locked?: boolean;
};

// TODO: mover pra tabela `bonus_items` no Supabase quando tivermos +5 itens.
// Estrutura já espelha o shape da futura tabela: { id, kind, title, description, meta, url, locked }.
const BONUSES: BonusItem[] = [
  {
    id: "protocolo-pele-porcelana",
    kind: "ebook",
    title: "Protocolo Pele de Porcelana",
    description: "O ritual usado para deixar a pele uniforme, viçosa e bonita mesmo sem maquiagem.",
    meta: "Em breve",
    locked: true,
  },
  {
    id: "guia-anti-erros-botox-coreano",
    kind: "guide",
    title: "Guia anti-erros do botox coreano manual",
    description: "Os erros silenciosos que impedem resultados e como evitar cada um deles.",
    meta: "Em breve",
    locked: true,
  },
  {
    id: "plano-leve-pos-desafio",
    kind: "guide",
    title: "Plano Leve de Manutenção Pós-Desafio",
    description: "Como preservar sua juventude facial conquistada com leveza e inteligência.",
    meta: "Em breve",
    locked: true,
  },
];

const KIND_META: Record<BonusKind, { label: string; icon: typeof BookOpen; tone: string }> = {
  ebook:  { label: "Ebook",  icon: BookOpen,    tone: "from-rose-500/20 to-rose-500/5 text-rose-600" },
  audio:  { label: "Áudio",  icon: Headphones,  tone: "from-violet-500/20 to-violet-500/5 text-violet-600" },
  pdf:    { label: "PDF",    icon: FileText,    tone: "from-amber-500/20 to-amber-500/5 text-amber-600" },
  guide:  { label: "Guia",   icon: FileText,    tone: "from-emerald-500/20 to-emerald-500/5 text-emerald-600" },
};

function PlusPage() {
  return (
    <div className="px-5 pb-10 pt-8">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-primary">
          Plus
        </p>
      </div>
      <h1 className="mt-2 font-display text-3xl leading-tight text-foreground">
        Conteúdo extra
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Bônus exclusivos pra aprofundar sua jornada, ebooks, áudios e guias.
      </p>

      <section className="mt-8 space-y-3">
        {BONUSES.map((b) => {
          const meta = KIND_META[b.kind];
          const Icon = meta.icon;
          const Wrapper: React.ElementType = b.locked || !b.url ? "div" : "a";
          const wrapperProps = b.url && !b.locked
            ? { href: b.url, target: "_blank" as const, rel: "noreferrer" }
            : {};

          return (
            <Wrapper key={b.id} {...wrapperProps} className="block">
              <Card className="group relative overflow-hidden rounded-3xl border border-border/40 bg-card/60 p-5 backdrop-blur-sm transition hover:border-border/70">
                <div className="flex gap-4">
                  <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${meta.tone}`}>
                    <Icon className="h-6 w-6" strokeWidth={1.75} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-muted-foreground">
                        {meta.label}
                      </span>
                      <span className="text-[10px] text-muted-foreground/60">·</span>
                      <span className="text-[10px] text-muted-foreground/80">{b.meta}</span>
                    </div>
                    <h3 className="mt-1 font-display text-lg leading-tight text-foreground">
                      {b.title}
                    </h3>
                    <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                      {b.description}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-start">
                    {b.locked ? (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                        <Lock className="h-3.5 w-3.5" />
                      </span>
                    ) : (
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                        {b.url?.startsWith("http") ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            </Wrapper>
          );
        })}
      </section>

      <p className="mt-8 text-center text-xs text-muted-foreground/70">
        Mais bônus chegando em breve ✨
      </p>
    </div>
  );
}
