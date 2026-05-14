import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, ArrowLeft, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin/moderation")({
  component: ModerationPage,
});

type Status = "pending" | "approved" | "rejected";

type Post = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  status: Status;
  author_name: string;
};

function ModerationPage() {
  const { user } = useAuth();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Status>("pending");
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "moderator"])
      .then(({ data }) => setAllowed((data ?? []).length > 0));
  }, [user]);

  const load = async (status: Status) => {
    setLoading(true);
    const { data } = await supabase
      .from("community_posts")
      .select("id, user_id, content, created_at, status, profiles!community_posts_profile_fk(name)")
      .eq("status", status)
      .order("created_at", { ascending: false });
    type Row = {
      id: string; user_id: string; content: string; created_at: string; status: Status;
      profiles: { name: string } | { name: string }[] | null;
    };
    setPosts(((data ?? []) as unknown as Row[]).map((p) => {
      const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      return {
        id: p.id, user_id: p.user_id, content: p.content,
        created_at: p.created_at, status: p.status,
        author_name: prof?.name ?? "Praticante",
      };
    }));
    setLoading(false);
  };

  useEffect(() => { if (allowed) load(tab); }, [tab, allowed]);

  const setStatus = async (id: string, status: Status) => {
    const prev = posts;
    setPosts((p) => p.filter((x) => x.id !== id));
    const { error } = await supabase
      .from("community_posts")
      .update({ status })
      .eq("id", id);
    if (error) {
      setPosts(prev);
      toast.error(error.message);
      return;
    }
    toast.success(status === "approved" ? "Post aprovado" : status === "rejected" ? "Post rejeitado" : "Atualizado");
  };

  if (allowed === null) {
    return <div className="px-5 pt-10 text-sm text-muted-foreground">Carregando…</div>;
  }
  if (!allowed) {
    return (
      <div className="px-5 pt-10">
        <p className="text-sm text-muted-foreground">Você não tem permissão para acessar a moderação.</p>
        <Link to="/" className="mt-4 inline-block text-sm text-primary underline">Voltar ao início</Link>
      </div>
    );
  }

  const tabs: { id: Status; label: string; icon: typeof Clock }[] = [
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
