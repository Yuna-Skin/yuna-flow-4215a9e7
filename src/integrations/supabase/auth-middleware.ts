// Auth middleware for server functions.
// Cookie-first (via @supabase/ssr) with a Bearer-header fallback for backwards compatibility
// during the localStorage -> cookie migration. The fallback can be removed in Phase B.6.
import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { createSupabaseServerClient } from './server-client';

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY;

  if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
    throw new Response(
      'Missing Supabase environment variables. Ensure SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY are set.',
      { status: 500 }
    );
  }

  // 1) Try cookie-based session (SSR path).
  try {
    const cookieClient = createSupabaseServerClient();
    const { data: userData } = await cookieClient.auth.getUser();
    if (userData?.user) {
      return next({
        context: {
          supabase: cookieClient,
          userId: userData.user.id,
          claims: { sub: userData.user.id, email: userData.user.email },
        },
      });
    }
  } catch {
    // fall through to bearer fallback
  }

  // 2) Fallback: Authorization: Bearer <token> (legacy path; remove in B.6).
  const request = getRequest();
  const authHeader = request?.headers?.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Response('Unauthorized: No valid session or bearer token', { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    throw new Response('Unauthorized: No token provided', { status: 401 });
  }

  const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    throw new Response('Unauthorized: Invalid token', { status: 401 });
  }

  return next({
    context: {
      supabase,
      userId: data.claims.sub,
      claims: data.claims,
    },
  });
});
