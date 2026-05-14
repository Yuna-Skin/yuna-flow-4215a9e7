import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const PUBLIC_MARKER = "/storage/v1/object/public/videos/";
const SIGN_MARKER = "/storage/v1/object/sign/videos/";

function extractStoragePath(url: string) {
  const marker = url.includes(PUBLIC_MARKER)
    ? PUBLIC_MARKER
    : url.includes(SIGN_MARKER)
      ? SIGN_MARKER
      : null;
  if (!marker) return null;
  return url.split(marker)[1]?.split("?")[0] ?? null;
}

const attachAuth = createMiddleware({ type: "function" })
  .client(async ({ next }) => {
    if (typeof window === "undefined") return next();
    const { supabase } = await import("@/integrations/supabase/client");
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return next();
    return next({ headers: { authorization: `Bearer ${session.access_token}` } });
  })
  .server(async ({ next }) => next());

export const getSignedWeekThumbnailUrl = createServerFn({ method: "GET" })
  .middleware([attachAuth, requireSupabaseAuth])
  .inputValidator((data) => z.object({ thumbnailUrl: z.string().nullable() }).parse(data))
  .handler(async ({ data, context }) => {
    if (!data.thumbnailUrl) return null;
    const path = extractStoragePath(data.thumbnailUrl);
    if (!path) return data.thumbnailUrl;
    const { data: signed, error } = await context.supabase.storage
      .from("videos")
      .createSignedUrl(path, 50 * 60);
    if (error || !signed?.signedUrl) return data.thumbnailUrl;
    return signed.signedUrl;
  });
