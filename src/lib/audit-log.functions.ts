import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { createSupabaseServerClient } from "@/integrations/supabase/server-client";

// Eventos jurídicos rastreados
const eventTypes = [
  "account_created",
  "login",
  "logout",
  "password_changed",
  "email_changed",
  "consent_accepted",
  "consent_changed",
  "account_deleted",
  "refund_requested",
] as const;

const logInput = z.object({
  event_type: z.enum(eventTypes),
  terms_version: z.string().max(20).optional(),
  privacy_version: z.string().max(20).optional(),
  marketing_consent: z.boolean().optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

/**
 * Registra evento jurídico no log de auditoria.
 * O user_id é SEMPRE derivado da sessão autenticada no servidor — nunca
 * aceito do cliente — para impedir forja de entradas atribuídas a outras
 * usuárias. Eventos sem sessão (ex.: tentativa de login falha) gravam
 * user_id = null.
 */
export const logAuditEvent = createServerFn({ method: "POST" })
  .inputValidator((input) => logInput.parse(input))
  .handler(async ({ data }) => {
    const ip = getRequestIP({ xForwardedFor: true }) ?? null;
    const userAgent = getRequestHeader("user-agent") ?? null;

    let userId: string | null = null;
    try {
      const supabase = createSupabaseServerClient();
      const { data: userData } = await supabase.auth.getUser();
      userId = userData?.user?.id ?? null;
    } catch {
      userId = null;
    }

    try {
      const { error } = await supabaseAdmin.from("legal_audit_logs").insert({
        user_id: userId,
        event_type: data.event_type,
        ip_address: ip,
        user_agent: userAgent,
        terms_version: data.terms_version ?? null,
        privacy_version: data.privacy_version ?? null,
        marketing_consent: data.marketing_consent ?? null,
        metadata: (data.metadata ?? null) as never,
      });

      if (error) {
        console.error("[audit-log] failed to insert", error);
        return { ok: false };
      }
      return { ok: true };
    } catch (e) {
      console.warn("[audit-log] skipped:", e instanceof Error ? e.message : String(e));
      return { ok: false };
    }
  });
