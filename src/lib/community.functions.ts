import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type CommunityStatus = "pending" | "approved" | "rejected";

export type CommunityPost = {
  id: string;
  user_id: string;
  content: string;
  likes_count: number;
  created_at: string;
  status: CommunityStatus;
  author_name: string;
  comment_count: number;
};

export type CommunityFeed = {
  posts: CommunityPost[];
  likedIds: string[];
  isModerator: boolean;
};

export const getCommunityFeed = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CommunityFeed> => {
    const { supabase, userId } = context;
    const [{ data: list }, { data: likes }, { data: roles }] = await Promise.all([
      supabase
        .from("community_posts")
        .select(
          "id, user_id, content, likes_count, created_at, status, profiles!community_posts_profile_fk(name), comments(id)",
        )
        .order("created_at", { ascending: false }),
      supabase.from("post_likes").select("post_id").eq("user_id", userId),
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .in("role", ["admin", "moderator"]),
    ]);

    type Row = {
      id: string;
      user_id: string;
      content: string;
      likes_count: number;
      created_at: string;
      status: CommunityStatus;
      profiles: { name: string } | { name: string }[] | null;
      comments: { id: string }[] | null;
    };

    const posts: CommunityPost[] = ((list ?? []) as unknown as Row[]).map((p) => {
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

    return {
      posts,
      likedIds: (likes ?? []).map((l) => l.post_id),
      isModerator: (roles ?? []).length > 0,
    };
  });

export const getPostComments = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ postId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: rows } = await supabase
      .from("comments")
      .select("id, content, profiles!comments_profile_fk(name)")
      .eq("post_id", data.postId)
      .order("created_at");
    type CRow = {
      id: string;
      content: string;
      profiles: { name: string } | { name: string }[] | null;
    };
    return ((rows ?? []) as unknown as CRow[]).map((c) => {
      const prof = Array.isArray(c.profiles) ? c.profiles[0] : c.profiles;
      return { id: c.id, content: c.content, author_name: prof?.name ?? "Praticante" };
    });
  });
