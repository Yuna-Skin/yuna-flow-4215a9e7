// Auth middleware for server functions — cookie-only (post Phase B.6).
import { createMiddleware } from '@tanstack/react-start';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { createSupabaseServerClient } from './server-client';

type AuthContext = {
  supabase: SupabaseClient<Database>;
  userId: string;
  claims: { sub: string; email?: string | null; [key: string]: unknown };
};

export const requireSupabaseAuth = createMiddleware({ type: 'function' }).server(async ({ next }) => {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
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
