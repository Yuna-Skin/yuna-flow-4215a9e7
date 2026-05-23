import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getMyAccess = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("access_control")
      .select("has_access, source")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) throw error;
    return {
      hasAccess: data?.has_access ?? false,
      source: data?.source ?? "pending",
    };
  });
