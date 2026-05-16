// Server-side Supabase client backed by the request's cookies.
// Use inside server functions / server routes where the current user's session is needed.
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server';
import type { Database } from './types';

export function createSupabaseServerClient() {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Response(
      'Missing Supabase environment variables. Ensure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are set.',
      { status: 500 }
    );
  }

  return createServerClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    cookies: {
      getAll() {
        // @tanstack/react-start/server exposes a per-cookie getter; we re-collect via document of request.
        // There is no getAll helper, so we read individual sb- cookies as @supabase/ssr requests them.
        // Fallback: return empty; @supabase/ssr falls back to individual get().
        return [];
      },
      setAll(cookies) {
        for (const { name, value, options } of cookies) {
          try {
            setCookie(name, value, options as CookieOptions);
          } catch {
            /* response may already be sent in some flows */
          }
        }
      },
      get(name: string) {
        return getCookie(name);
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          setCookie(name, value, options);
        } catch {
          /* noop */
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          deleteCookie(name, options);
        } catch {
          /* noop */
        }
      },
    } as never, // @supabase/ssr accepts either the get/set/remove or getAll/setAll shape
  });
}
