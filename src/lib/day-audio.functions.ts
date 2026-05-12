import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const STORAGE_PUBLIC_URL_MARKER = "/storage/v1/object/public/videos/";

function extractStoragePath(audioUrl: string) {
  if (!audioUrl.includes(STORAGE_PUBLIC_URL_MARKER)) return null;
  return audioUrl.split(STORAGE_PUBLIC_URL_MARKER)[1]?.split("?")[0] ?? null;
}

function extractFileName(audioUrl: string) {
  const cleanUrl = audioUrl.split("?")[0] ?? audioUrl;
  const parts = cleanUrl.split("/").filter(Boolean);
  return parts.at(-1) ?? null;
}

export const getPlayableDayAudioUrl = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ dayId: z.string().uuid(), audioUrl: z.string().nullable() }).parse(data))
  .handler(async ({ data }) => {
    if (!data.audioUrl) return null;

    const directPath = extractStoragePath(data.audioUrl);

    let storagePath = directPath;

    if (!storagePath) {
      const { data: linkedAsset } = await supabaseAdmin
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
        const { data: filenameMatch } = await supabaseAdmin
          .from("media_assets")
          .select("path")
          .eq("bucket", "videos")
          .eq("file_name", fileName)
          .maybeSingle();

        storagePath = filenameMatch?.path ?? null;
      }
    }

    if (!storagePath) return data.audioUrl;

    const { data: signed, error } = await supabaseAdmin.storage
      .from("videos")
      .createSignedUrl(storagePath, 60 * 60);

    if (error || !signed?.signedUrl) {
      console.error("Failed to create signed audio URL", error);
      return data.audioUrl;
    }

    return signed.signedUrl;
  });