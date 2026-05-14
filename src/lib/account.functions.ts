import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

/**
 * Exclui permanentemente a conta da usuária autenticada.
 *
 * Fluxo:
 * 1. Middleware confirma que o token bearer é válido (re-auth feita no cliente
 *    via signInWithPassword logo antes da chamada).
 * 2. Registra evento `account_deleted` no log jurídico ANTES da exclusão
 *    (preserva a prova de auditoria mesmo após o delete).
 * 3. Apaga dados pessoais (profile, progress, streak, likes, comments, posts).
 *    Mantém `user_consents` e `legal_audit_logs` por exigência legal.
 * 4. Apaga o usuário do auth.users via service role.
 *
 * Dados preservados intencionalmente:
 * - legal_audit_logs (auditoria LGPD / antifraude)
 * - user_consents (prova de aceite legal)
 */
export const deleteMyAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { userId } = context;

    const ip = getRequestIP({ xForwardedFor: true }) ?? null;
    const userAgent = getRequestHeader("user-agent") ?? null;

    // 1. Log ANTES da exclusão (preserva trilha de auditoria)
    await supabaseAdmin.from("legal_audit_logs").insert({
      user_id: userId,
      event_type: "account_deleted",
      ip_address: ip,
      user_agent: userAgent,
      metadata: { reason: "user_request" },
    });

    // 2. Apaga dados pessoais (RLS bypass via service role).
    // Mantemos `user_consents` e `legal_audit_logs` por exigência legal.
    await Promise.allSettled([
      supabaseAdmin.from("post_likes").delete().eq("user_id", userId),
      supabaseAdmin.from("feed_likes").delete().eq("user_id", userId),
      supabaseAdmin.from("comments").delete().eq("user_id", userId),
      supabaseAdmin.from("community_posts").delete().eq("user_id", userId),
      supabaseAdmin.from("user_progress").delete().eq("user_id", userId),
      supabaseAdmin.from("user_streak").delete().eq("user_id", userId),
      supabaseAdmin.from("user_roles").delete().eq("user_id", userId),
      supabaseAdmin.from("access_control").delete().eq("user_id", userId),
      supabaseAdmin.from("profiles").delete().eq("id", userId),
    ]);

    // 3. Apaga avatares do storage
    const { data: avatarFiles } = await supabaseAdmin.storage
      .from("avatars")
      .list(userId);
    if (avatarFiles && avatarFiles.length > 0) {
      await supabaseAdmin.storage
        .from("avatars")
        .remove(avatarFiles.map((f) => `${userId}/${f.name}`));
    }

    // 4. Apaga o usuário do auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authError) {
      throw new Error(`Falha ao excluir conta: ${authError.message}`);
    }

    return { ok: true };
  });
