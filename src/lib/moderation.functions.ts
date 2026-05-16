import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export type ModerationStatus = "pending" | "approved" | "rejected";

export type ModerationPost = {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  status: ModerationStatus;
  author_name: string;
};

export type ModerationData = {
  allowed: boolean;
  posts: ModerationPost[];
};

const StatusSchema = z.enum(["pending", "approved", "rejected"]);

export const getModerationPosts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ status: StatusSchema }).parse(data))
  .handler(async ({ data, context }): Promise<ModerationData> => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "moderator"]);
    const allowed = (roles ?? []).length > 0;
    if (!allowed) return { allowed: false, posts: [] };

    const { data: rows, error } = await supabase
      .from("community_posts")
      .select(
        "id, user_id, content, created_at, status, profiles!community_posts_profile_fk(name)",
      )
      .eq("status", data.status)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    type Row = {
      id: string;
      user_id: string;
      content: string;
      created_at: string;
      status: ModerationStatus;
      profiles: { name: string } | { name: string }[] | null;
    };
    const posts: ModerationPost[] = ((rows ?? []) as unknown as Row[]).map((p) => {
      const prof = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
      return {
        id: p.id,
        user_id: p.user_id,
        content: p.content,
        created_at: p.created_at,
        status: p.status,
        author_name: prof?.name ?? "Praticante",
      };
    });
    return { allowed: true, posts };
  });
