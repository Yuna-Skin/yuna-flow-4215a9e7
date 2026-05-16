import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type ProfileWithJourney = {
  name: string;
  avatarUrl: string | null;
  completed: number;
  totalActiveDays: number;
};

export const getMyProfileWithJourney = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ProfileWithJourney> => {
    const { supabase, userId } = context;
    const [{ data: prof }, { count: completed }, { data: days }] = await Promise.all([
      supabase.from("profiles").select("name, avatar_url").eq("id", userId).maybeSingle(),
      supabase
        .from("user_progress")
        .select("day_id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("completed", true),
      supabase.from("days").select("id").eq("is_rest", false),
    ]);
    return {
      name: prof?.name ?? "Praticante",
      avatarUrl: prof?.avatar_url ?? null,
      completed: completed ?? 0,
      totalActiveDays: days?.length ?? 0,
    };
  });
