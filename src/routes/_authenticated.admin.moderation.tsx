import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, ArrowLeft, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { moderationPostsQueryOptions } from "@/lib/queries/moderation.queries";
import type { ModerationStatus } from "@/lib/moderation.functions";
import { RouteError } from "@/components/RouteError";
import { RouteNotFound } from "@/components/RouteNotFound";

export const Route = createFileRoute("/_authenticated/admin/moderation")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  component: ModerationPage,
});

function ModerationPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<ModerationStatus>("pending");
  const q = useQuery(moderationPostsQueryOptions(tab));

  const allowed = q.data?.allowed;
  const posts = q.data?.posts ?? [];
  const loading = q.isLoading;

  const setStatus = async (id: string, status: ModerationStatus) => {
    const { error } = await supabase
      .from("community_posts")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Post aprovado" : status === "rejected" ? "Post rejeitado" : "Atualizado");
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["moderation-posts"] }),
      queryClient.invalidateQueries({ queryKey: ["community-feed"] }),
    ]);
  };

  if (q.isLoading && allowed === undefined) {
    return <div className="px-5 pt-10 text-sm text-muted-foreground">Carregando…</div>;
  }
  if (allowed === false) {
    return (
      <div className="px-5 pt-10">
        <p className="text-sm text-muted-foreground">Você não tem permissão para acessar a moderação.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary underline">Voltar ao início</Link>
      </div>
    );
  }

  const tabs: { id: ModerationStatus; label: string; icon: typeof Clock }[] = [
    { id: "pending", label: "Pendentes", icon: Clock },
    { id: "approved", label: "Aprovados", icon: Check },
    { id: "rejected", label: "Rejeitados", icon: X },
  ];

  return (
    <div className="px-5 pb-10 pt-8">
      <Link to="/community" className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-3.5 w-3.5" />
        Comunidade
      </Link>
      <div className="mt-3 flex items-center gap-2">
        <Shield className="h-5 w-5 text-primary" />
        <h1 className="font-display text-3xl text-foreground">Moderação</h1>
      </div>
      <p className="mt-1 text-sm text-muted-foreground">Aprove ou rejeite as mensagens da comunidade</p>

      <div className="mt-6 flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition",
              tab === t.id
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <t.icon className="h-3.5 w-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-5 space-y-3">
        {loading && <p className="py-6 text-center text-sm text-muted-foreground">Carregando…</p>}
        {!loading && posts.length === 0 && (
          <p className="py-10 text-center text-sm text-muted-foreground">Nenhum post {tab === "pending" ? "pendente" : tab === "approved" ? "aprovado" : "rejeitado"}.</p>
        )}
        {posts.map((p) => (
          <Card key={p.id} className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                {p.author_name[0]?.toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{p.author_name}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleString("pt-BR")}</p>
              </div>
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{p.content}</p>

            <div className="mt-4 flex gap-2">
              {p.status !== "approved" && (
                <Button size="sm" className="rounded-full" onClick={() => setStatus(p.id, "approved")}>
                  <Check className="h-4 w-4" />
                  Aprovar
                </Button>
              )}
              {p.status !== "rejected" && (
                <Button size="sm" variant="outline" className="rounded-full" onClick={() => setStatus(p.id, "rejected")}>
                  <X className="h-4 w-4" />
                  Rejeitar
                </Button>
              )}
              {p.status !== "pending" && (
                <Button size="sm" variant="ghost" className="rounded-full" onClick={() => setStatus(p.id, "pending")}>
                  <Clock className="h-4 w-4" />
                  Voltar para pendente
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
