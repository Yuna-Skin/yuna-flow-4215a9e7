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

    // 2. Apaga dados pessoais (RLS bypass via service role)
    // Ordem importa pra respeitar dependências lógicas
    const tables = [
      "post_likes",
      "feed_likes",
      "comments",
      "community_posts",
      "user_progress",
      "user_streak",
      "user_roles",
      "access_control",
      "profiles",
    ] as const;

    for (const table of tables) {
      const { error } = await supabaseAdmin.from(table).delete().eq("user_id", userId);
      // profiles usa `id`, não `user_id`
      if (error && table === "profiles") {
        await supabaseAdmin.from("profiles").delete().eq("id", userId);
      }
    }
    // Garante profiles (PK = id, não user_id)
    await supabaseAdmin.from("profiles").delete().eq("id", userId);

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
