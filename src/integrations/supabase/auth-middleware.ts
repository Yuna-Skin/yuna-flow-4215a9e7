import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { createSupabaseServerClient } from './server-client';

type AuthContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
  claims: { sub: string; email?: string | null; [key: string]: unknown };
};

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const request = getRequest();

  const createBearerClient = (accessToken: string): SupabaseClient<Database> => {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

    if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
      throw new Response(
        'Missing Supabase environment variables. Ensure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are set.',
        { status: 500 },
      );
    }

    return createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  };

  let supabase = createSupabaseServerClient();
  let { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    const authHeader = request.headers.get('authorization');
    const bearerToken = authHeader?.replace(/^Bearer\s+/i, '').trim();

    if (bearerToken) {
      supabase = createBearerClient(bearerToken);
      const fallback = await supabase.auth.getUser();
      data = fallback.data;
      error = fallback.error;
    }
  }

  if (error || !data?.user) {
    throw new Response('Unauthorized', { status: 401 });
  }
  const ctx: AuthContext = {
    supabase,
    userId: data.user.id,
    claims: { sub: data.user.id, email: data.user.email ?? null },
  };
  return next({ context: ctx });
});
