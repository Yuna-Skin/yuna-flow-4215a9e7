
# Fase B — Migração de auth para cookies com `@supabase/ssr`

> **STATUS: 100% CONCLUÍDA (B.0–B.6).**
>
> - Sessão Supabase em cookie (`@supabase/ssr`), `sameSite='none'; secure` (compat iframe + produção).
> - Loaders SSR sem guard `typeof window`.
> - `_authenticated.tsx` `beforeLoad` via `getSession()`.
> - `requireSupabaseAuth` **cookie-only** (sem bearer fallback).
> - `src/start.ts` limpo (sem attach manual de bearer).
> - `auth-attacher.ts` removido.
> - Migração silenciosa localStorage→cookie removida (Phase B já estável).
>
> Próximas fases possíveis: cache de borda Cloudflare, `Cache-Control: private, no-store` em rotas auth.
