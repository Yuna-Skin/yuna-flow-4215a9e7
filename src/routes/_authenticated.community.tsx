import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Heart, MessageCircle, Send, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  communityFeedQueryOptions,
  postCommentsQueryOptions,
} from "@/lib/queries/community.queries";
import { RouteError } from "@/components/RouteError";
import { RouteNotFound } from "@/components/RouteNotFound";

export const Route = createFileRoute("/_authenticated/community")({
  errorComponent: RouteError,
  notFoundComponent: RouteNotFound,
  component: CommunityPage,
});

function CommunityPage() {
  const { user } = useAuth();
  const userId = user?.id;
  const queryClient = useQueryClient();

  const feedQ = useQuery(communityFeedQueryOptions(userId));
  const posts = feedQ.data?.posts ?? [];
  const liked = new Set(feedQ.data?.likedIds ?? []);
  const isModerator = feedQ.data?.isModerator ?? false;

  const [content, setContent] = useState("");
  const [posting, setPosting] = useState(false);
  const [openComments, setOpenComments] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState("");

  const invalidateFeed = () =>
    queryClient.invalidateQueries({ queryKey: ["community-feed"] });

  const submitPost = async () => {
    if (!user || !content.trim()) return;
    setPosting(true);
    const { error } = await supabase.from("community_posts").insert({
      user_id: user.id,
      content: content.trim(),
    });
    setPosting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setContent("");
    toast.success("Mensagem enviada para revisão");
    await invalidateFeed();
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const isLiked = liked.has(postId);
    if (isLiked) {
      await supabase.from("post_likes").delete().eq("post_id", postId).eq("user_id", user.id);
    } else {
      await supabase.from("post_likes").insert({ post_id: postId, user_id: user.id });
    }
    await invalidateFeed();
  };

  const submitComment = async (postId: string) => {
    if (!user || !commentInput.trim()) return;
    const { error } = await supabase.from("comments").insert({
      post_id: postId,
      user_id: user.id,
      content: commentInput.trim(),
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    setCommentInput("");
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["post-comments", postId] }),
      invalidateFeed(),
    ]);
  };

  return (
    <div className="px-5 pb-6 pt-8">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-foreground">Comunidade</h1>
          <p className="text-sm text-muted-foreground">Compartilhe sua jornada</p>
        </div>
        {isModerator && (
          <Link
            to="/admin/moderation"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted"
          >
            <Shield className="h-3.5 w-3.5" />
            Moderar
          </Link>
        )}
      </div>

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
                  onClick={() => toggleLike(p.id)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                    liked.has(p.id) ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Heart className={cn("h-4 w-4", liked.has(p.id) && "fill-primary")} />
                  {p.likes_count}
                </button>
                <button
                  onClick={() => setOpenComments(openComments === p.id ? null : p.id)}
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
                >
                  <MessageCircle className="h-4 w-4" />
                  {p.comment_count}
                </button>
              </div>
            )}

            {openComments === p.id && (
              <CommentsSection
                postId={p.id}
                value={commentInput}
                onChange={setCommentInput}
                onSubmit={() => submitComment(p.id)}
              />
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function CommentsSection({
  postId,
  value,
  onChange,
  onSubmit,
}: {
  postId: string;
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
}) {
  const q = useQuery(postCommentsQueryOptions(postId));
  const items = q.data ?? [];
  return (
    <div className="mt-3 border-t border-border pt-3">
      <ul className="space-y-2">
        {items.map((c) => (
          <li key={c.id} className="rounded-xl bg-muted px-3 py-2">
            <p className="text-xs font-medium text-foreground">{c.author_name}</p>
            <p className="text-sm text-muted-foreground">{c.content}</p>
          </li>
        ))}
      </ul>
      <div className="mt-2 flex gap-2">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Comentar..."
          className="flex-1 rounded-full border border-input bg-background px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <Button size="sm" onClick={onSubmit} className="rounded-full">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
