import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const consentInput = z.object({
  accepted_terms: z.literal(true),
  accepted_privacy: z.literal(true),
  terms_version: z.string().min(1).max(20),
  privacy_version: z.string().min(1).max(20),
});

export const recordConsent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => consentInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const ip = getRequestIP({ xForwardedFor: true }) ?? null;
    const userAgent = getRequestHeader("user-agent") ?? null;

    const { error } = await supabase.from("user_consents").insert({
      user_id: userId,
      accepted_terms: data.accepted_terms,
      accepted_privacy: data.accepted_privacy,
      terms_version: data.terms_version,
      privacy_version: data.privacy_version,
      ip_address: ip,
      user_agent: userAgent,
    });

    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getLatestConsent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("user_consents")
      .select("terms_version, privacy_version, accepted_at")
      .eq("user_id", userId)
      .order("accepted_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw new Error(error.message);
    return data;
  });
