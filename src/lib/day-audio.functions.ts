import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const STORAGE_PUBLIC_URL_MARKER = "/storage/v1/object/public/videos/";
const STORAGE_SIGN_URL_MARKER = "/storage/v1/object/sign/videos/";

function extractStoragePath(audioUrl: string) {
  const marker = audioUrl.includes(STORAGE_PUBLIC_URL_MARKER)
    ? STORAGE_PUBLIC_URL_MARKER
    : audioUrl.includes(STORAGE_SIGN_URL_MARKER)
      ? STORAGE_SIGN_URL_MARKER
      : null;
  if (!marker) return null;
  return audioUrl.split(marker)[1]?.split("?")[0] ?? null;
}

function extractFileName(audioUrl: string) {
  const cleanUrl = audioUrl.split("?")[0] ?? audioUrl;
  const parts = cleanUrl.split("/").filter(Boolean);
  return parts.at(-1) ?? null;
}

export const getPlayableDayAudioUrl = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ dayId: z.string().uuid(), audioUrl: z.string().nullable() }).parse(data))
  .handler(async ({ data, context }) => {
    if (!data.audioUrl) return null;

    const { supabase } = context;

    const directPath = extractStoragePath(data.audioUrl);
    let storagePath = directPath;

    if (!storagePath) {
      const { data: linkedAsset } = await supabase
        .from("media_assets")
        .select("path")
        .eq("bucket", "videos")
        .eq("linked_table", "days")
        .eq("linked_id", data.dayId)
        .eq("linked_column", "audio_url")
        .maybeSingle();

      storagePath = linkedAsset?.path ?? null;
    }

    if (!storagePath) {
      const fileName = extractFileName(data.audioUrl);
      if (fileName) {
        const { data: filenameMatch } = await supabase
          .from("media_assets")
          .select("path")
          .eq("bucket", "videos")
          .eq("file_name", fileName)
          .maybeSingle();

        storagePath = filenameMatch?.path ?? null;
      }
    }

    if (!storagePath) return data.audioUrl;

    const { data: signed, error } = await supabase.storage
      .from("videos")
      .createSignedUrl(storagePath, 60 * 60);

    if (error || !signed?.signedUrl) {
      console.error("Failed to create signed audio URL", error);
      return data.audioUrl;
    }

    return signed.signedUrl;
  });
