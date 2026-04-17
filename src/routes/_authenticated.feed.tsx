import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { Heart, Lightbulb, Play, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/feed")({
  component: FeedPage,
});

type FeedItem = {
  id: string;
  type: "video" | "tip" | "text";
  title: string;
  content: string | null;
  media_url: string | null;
  likes_count: number;
};

function FeedPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<FeedItem[]>([]);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [{ data: list }, { data: likes }] = await Promise.all([
        supabase.from("feed_items").select("*").order("created_at", { ascending: false }),
        supabase.from("feed_likes").select("feed_item_id").eq("user_id", user.id),
      ]);
      setItems((list ?? []) as FeedItem[]);
      setLiked(new Set((likes ?? []).map((l) => l.feed_item_id)));
    })();
  }, [user]);

  const toggleLike = async (item: FeedItem) => {
    if (!user) return;
    const isLiked = liked.has(item.id);
    // optimistic
    setLiked((prev) => {
      const n = new Set(prev);
      if (isLiked) n.delete(item.id); else n.add(item.id);
      return n;
    });
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, likes_count: i.likes_count + (isLiked ? -1 : 1) } : i)),
    );
    if (isLiked) {
      await supabase.from("feed_likes").delete().eq("feed_item_id", item.id).eq("user_id", user.id);
    } else {
      await supabase.from("feed_likes").insert({ feed_item_id: item.id, user_id: user.id });
    }
  };

  return (
    <div className="px-5 pb-6 pt-8">
      <h1 className="font-display text-3xl text-foreground">Feed</h1>
      <p className="text-sm text-muted-foreground">Inspirações para sua prática</p>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <Card key={item.id} className="overflow-hidden border-border p-0 shadow-sm">
            {item.type === "video" && item.media_url && (
              <div className="aspect-video bg-black">
                <iframe src={item.media_url} className="h-full w-full" allowFullScreen title={item.title} />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-primary">
                {item.type === "tip" && <><Lightbulb className="h-3.5 w-3.5" /> Dica</>}
                {item.type === "text" && <><FileText className="h-3.5 w-3.5" /> Reflexão</>}
                {item.type === "video" && <><Play className="h-3.5 w-3.5" /> Vídeo</>}
              </div>
              <h3 className="mt-2 font-display text-xl text-foreground">{item.title}</h3>
              {item.content && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{item.content}</p>
              )}
              <button
                onClick={() => toggleLike(item)}
                className={cn(
                  "mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm transition-colors",
                  liked.has(item.id)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Heart className={cn("h-4 w-4", liked.has(item.id) && "fill-primary")} />
                {item.likes_count}
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
