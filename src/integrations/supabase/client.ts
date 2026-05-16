// Browser Supabase client — sessão persistida em cookie (via @supabase/ssr).
// Cookies são readable pelo server runtime, habilitando SSR em rotas autenticadas.
import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

function getEnv() {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      'Missing Supabase environment variables. Ensure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY (or VITE_ prefixed versions) are set.'
    );
  }
  return { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY };
}

function createSupabaseClient() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = getEnv();

  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  const isSecure =
    isBrowser && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');

  // sameSite='none' + secure: necessário pra cookie persistir dentro do
  // iframe do preview Lovable (contexto cross-site). Em produção (domínio
  // próprio) também funciona — cookie é first-party.
  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookieOptions: {
      path: '/',
      sameSite: isSecure ? 'none' : 'lax',
      secure: isSecure,
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;

export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) {
      _supabase = createSupabaseClient();
    }
    return Reflect.get(_supabase, prop, receiver);
  },
});
