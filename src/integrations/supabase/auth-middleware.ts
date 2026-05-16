// Auth middleware for server functions.
// Cookie-first (via @supabase/ssr) with a Bearer-header fallback for backwards compatibility
// during the localStorage -> cookie migration. The fallback can be removed in Phase B.6.
import { createMiddleware } from '@tanstack/react-start';
import { getRequest } from '@tanstack/react-start/server';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { createSupabaseServerClient, createSupabaseBearerClient } from './server-client';

type AuthContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
  claims: { sub: string; email?: string | null; [key: string]: unknown };
};

async function resolveAuthContext(): Promise<AuthContext> {
  // 1) Try cookie-based session (SSR path).
  try {
    const cookieClient = createSupabaseServerClient();
    const { data: userData } = await cookieClient.auth.getUser();
    if (userData?.user) {
      return {
        supabase: cookieClient,
        userId: userData.user.id,
        claims: { sub: userData.user.id, email: userData.user.email ?? null },
      };
    }
  } catch {
    // fall through
  }

  // 2) Fallback: Authorization: Bearer <token> (legacy; remove in B.6).
  const request = getRequest();
  const authHeader = request?.headers?.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Response('Unauthorized: No valid session or bearer token', { status: 401 });
  }
  const token = authHeader.replace('Bearer ', '');
  if (!token) {
    throw new Response('Unauthorized: No token provided', { status: 401 });
  }

  const supabase = createSupabaseBearerClient(token);
  const { data, error } = await supabase.auth.getClaims(token);
  if (error || !data?.claims?.sub) {
    throw new Response('Unauthorized: Invalid token', { status: 401 });
  }

  return {
    supabase,
    userId: data.claims.sub,
    claims: { ...data.claims, sub: data.claims.sub },
  };
}

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const ctx = await resolveAuthContext();
  return next({ context: ctx });
});
