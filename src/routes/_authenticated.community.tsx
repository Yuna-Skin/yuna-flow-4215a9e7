import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Send, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/community")({
  component: CommunityPage,
});

type Status = "pending" | "approved" | "rejected";

type Post = {
  id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  status: Status;
  author_name: string;
  comment_count: number;
};

function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [comments, setComments] = useState<Record<string, { id: string; content: string; author_name: string }[]>>({});
  const [commentInput, setCommentInput] = useState("");

  const load = async () => {
    if (!user) return;
    const [{ data: list }, { data: likes }] = await Promise.all([
      supabase
        .from("community_posts")
        .select("id, user_id, content, likes_count, created_at, status, profiles!community_posts_profile_fk(name), comments(id)")
        .order("created_at", { ascending: false }),
      supabase.from("post_likes").select("post_id").eq("user_id", user.id),
    ]);
    type Row = {
      id: string; user_id: string; content: string; likes_count: number; created_at: string; status: Status;
      profiles: { name: string } | { name: string }[] | null;
      comments: { id: string }[] | null;
    };
    const mapped: Post[] = ((list ?? []) as unknown as Row[]).map((p) => {
      const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      return {
        id: p.id,
        user_id: p.user_id,
        content: p.content,
        likes_count: p.likes_count,
        created_at: p.created_at,
        status: p.status,
        author_name: prof?.name ?? "Praticante",
        comment_count: p.comments?.length ?? 0,
      };
    });
    setPosts(mapped);
    setLiked(new Set((likes ?? []).map((l) => l.post_id)));
  };

  useEffect(() => { load(); }, [user]);

  const submitPost = async () => {
    if (!user || !content.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("community_posts").insert({ user_id: user.id, content: content.trim() });
    setPosting(false);
    if (error) { toast.error(error.message); return; }
    setContent("");
    toast.success("Mensagem enviada para revisão");
    load();
  };

  const toggleLike = async (p: Post) => {
    if (!user) return;
    const isLiked = liked.has(p.id);
    setLiked((prev) => { const n = new Set(prev); isLiked ? n.delete(p.id) : n.add(p.id); return n; });
    setPosts((prev) => prev.map((x) => x.id === p.id ? { ...x, likes_count: x.likes_count + (isLiked ? -1 : 1) } : x));
    if (isLiked) {
      await supabase.from("post_likes").delete().eq("post_id", p.id).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: p.id, user_id: user.id });
    }
  };

  const loadComments = async (postId: string) => {
    const { data } = await supabase
      .from("comments")
      .select("id, content, profiles!comments_profile_fk(name)")
      .eq("post_id", postId)
      .order("created_at");
    type CRow = { id: string; content: string; profiles: { name: string } | { name: string }[] | null };
    const mapped = ((data ?? []) as unknown as CRow[]).map((c) => {
      const prof = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
      return { id: c.id, content: c.content, author_name: prof?.name ?? "Praticante" };
    });
    setComments((prev) => ({ ...prev, [postId]: mapped }));
  };

  const submitComment = async (postId: string) => {
    if (!user || !commentInput.trim()) return;
    const { error } = await supabase.from("comments").insert({
      post_id: postId, user_id: user.id, content: commentInput.trim(),
    });
    if (error) { toast.error(error.message); return; }
    setCommentInput("");
    loadComments(postId);
    setPosts((prev) => prev.map((x) => x.id === postId ? { ...x, comment_count: x.comment_count + 1 } : x));
  };

  return (
    <div className="px-5 pb-6 pt-8">
      <h1 className="font-display text-3xl text-foreground">Comunidade</h1>
      <p className="text-sm text-muted-foreground">Compartilhe sua jornada</p>

      <Card className="mt-6 p-4">
        <Textarea
          placeholder="Como foi sua prática hoje?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
        />
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-[11px] text-muted-foreground">
            Sua mensagem passará por revisão antes de aparecer
          </p>
          <Button onClick={submitPost} disabled={posting || !content.trim()} size="sm" className="rounded-full">
            <Send className="h-4 w-4" />
            Enviar
          </Button>
        </div>
      </Card>

      <div className="mt-5 space-y-3">
        {posts.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">Seja a primeira a postar 🌸</p>
        )}
        {posts.map((p) => (
          <Card key={p.id} className={cn("p-4", p.status === "pending" && "border-dashed border-primary/40 bg-primary/5")}>
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-medium text-accent-foreground">
                {p.author_name[0]?.toUpperCase()}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{p.author_name}</p>
                <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              {p.status === "pending" && (
                <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                  Em revisão
                </span>
              )}
              {p.status === "rejected" && (
                <span className="rounded-full bg-destructive/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-destructive">
                  Rejeitado
                </span>
              )}
            </div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{p.content}</p>

            {p.status === "approved" && (
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => toggleLike(p)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                    liked.has(p.id) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Heart className={cn("h-4 w-4", liked.has(p.id) && "fill-primary")} />
                  {p.likes_count}
                </button>
                <button
                  onClick={() => {
                    const next = openComments === p.id ? null : p.id;
                    setOpenComments(next);
                    if (next) loadComments(p.id);
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <MessageCircle className="h-4 w-4" />
                  {p.comment_count}
                </button>
              </div>
            )}

            {openComments === p.id && (
              <div className="mt-3 border-t border-border pt-3">
                <ul className="space-y-2">
                  {(comments[p.id] ?? []).map((c) => (
                    <li key={c.id} className="rounded-xl bg-muted px-3 py-2">
                      <p className="text-xs font-medium text-foreground">{c.author_name}</p>
                      <p className="text-sm text-muted-foreground">{c.content}</p>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 flex gap-2">
                  <input
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder="Comentar..."
                    className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                  />
                  <Button size="sm" onClick={() => submitComment(p.id)} className="rounded-full">
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}
