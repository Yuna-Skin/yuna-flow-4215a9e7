// Browser Supabase client backed by cookies (via @supabase/ssr).
// Cookies are readable by the server runtime, enabling SSR for authenticated routes.
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

// Project ref used by Supabase cookie/localStorage keys (sb-<ref>-auth-token).
function getProjectRef(): string | null {
  try {
    const url = new URL(getEnv().SUPABASE_URL);
    return url.hostname.split('.')[0] || null;
  } catch {
    return null;
  }
}

function createSupabaseClient() {
  const { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } = getEnv();

  const isBrowser = typeof window !== 'undefined' && typeof document !== 'undefined';
  const isSecure =
    isBrowser && (window.location.protocol === 'https:' || window.location.hostname === 'localhost');

  return createBrowserClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookieOptions: {
      path: '/',
      sameSite: 'lax',
      secure: isSecure,
      // Cookie cannot be httpOnly because the browser client must read/write it.
      // The server reads the same cookie via @supabase/ssr's createServerClient.
    },
  });
}

let _supabase: ReturnType<typeof createSupabaseClient> | undefined;
let _migrated = false;

// Migrate legacy localStorage session (set by the previous @supabase/supabase-js client)
// into the new cookie store. Runs once per page load. Safe to call repeatedly.
async function migrateLegacySession(client: ReturnType<typeof createSupabaseClient>) {
  if (_migrated) return;
  _migrated = true;
  if (typeof window === 'undefined') return;
  const ref = getProjectRef();
  if (!ref) return;
  const legacyKey = `sb-${ref}-auth-token`;
  try {
    const raw = window.localStorage.getItem(legacyKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    const access_token: string | undefined = parsed?.access_token ?? parsed?.currentSession?.access_token;
    const refresh_token: string | undefined = parsed?.refresh_token ?? parsed?.currentSession?.refresh_token;
    if (access_token && refresh_token) {
      // Re-inject the existing session — persists into the cookie store.
      await client.auth.setSession({ access_token, refresh_token });
    }
  } catch {
    // ignore — user will simply need to re-login
  } finally {
    try {
      window.localStorage.removeItem(legacyKey);
    } catch {
      /* noop */
    }
  }
}

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";
export const supabase = new Proxy({} as ReturnType<typeof createSupabaseClient>, {
  get(_, prop, receiver) {
    if (!_supabase) {
      _supabase = createSupabaseClient();
      // Fire-and-forget; no await needed on access.
      void migrateLegacySession(_supabase);
    }
    return Reflect.get(_supabase, prop, receiver);
  },
});
