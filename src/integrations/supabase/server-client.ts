// Server-side Supabase client backed by the request's cookies.
// Use inside server functions / server routes where the current user's session is needed.
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { getCookie, setCookie, deleteCookie } from '@tanstack/react-start/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export function createSupabaseServerClient(): SupabaseClient<Database> {
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
      get(name: string) {
        return getCookie(name);
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          setCookie(name, value, options);
        } catch {
          /* response may already be sent */
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          deleteCookie(name, options);
        } catch {
          /* noop */
        }
      },
    },
  }) as unknown as SupabaseClient<Database>;
}

