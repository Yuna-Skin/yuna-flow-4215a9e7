import { createServerFn } from "@tanstack/react-start";
import { notFound } from "@tanstack/react-router";
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

export type DayMovement = {
  id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration: string | null;
  order_index: number;
};

export type DayExercise = {
  id: string;
  title: string;
  movements: DayMovement[];
};

export type DayDetail = {
  id: string;
  day_number: number;
  title: string;
  video_url: string | null;
  audio_url: string | null;
  respiration_text: string | null;
  reflection_text: string | null;
  is_rest: boolean;
  week_id: string | null;
  week_title: string | null;
  exercises: DayExercise[];
};

async function resolvePlayableAudio(
  supabase: any,
  dayId: string,
  audioUrl: string | null,
): Promise<string | null> {
  if (!audioUrl) return null;

  const directPath = extractStoragePath(audioUrl);
  let storagePath = directPath;

  if (!storagePath) {
    const { data: linkedAsset } = await (supabase as any)
      .from("media_assets")
      .select("path")
      .eq("bucket", "videos")
      .eq("linked_table", "days")
      .eq("linked_id", dayId)
      .eq("linked_column", "audio_url")
      .maybeSingle();
    storagePath = linkedAsset?.path ?? null;
  }

  if (!storagePath) {
    const fileName = extractFileName(audioUrl);
    if (fileName) {
      const { data: filenameMatch } = await (supabase as any)
        .from("media_assets")
        .select("path")
        .eq("bucket", "videos")
        .eq("file_name", fileName)
        .maybeSingle();
      storagePath = filenameMatch?.path ?? null;
    }
  }

  if (!storagePath) return audioUrl;

  const { data: signed, error } = await (supabase as any).storage
    .from("videos")
    .createSignedUrl(storagePath, 50 * 60);

  if (error || !signed?.signedUrl) {
    console.error("Failed to create signed audio URL", error);
    return audioUrl;
  }

  return signed.signedUrl;
}

export const getDayDetail = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ dayId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }): Promise<DayDetail> => {
    const { supabase } = context;

    const { data: dayRow, error } = await supabase
      .from("days")
      .select(
        "id, day_number, title, video_url, audio_url, respiration_text, reflection_text, is_rest, week_id, weeks(title, order_index)",
      )
      .eq("id", data.dayId)
      .maybeSingle();

    if (error) throw new Error(error.message);
    if (!dayRow) throw notFound();

    const playableAudioUrl = await resolvePlayableAudio(supabase as any, dayRow.id, dayRow.audio_url ?? null);

    const { data: exs } = await supabase
      .from("exercises")
      .select(
        "id, title, order_index, movements(id, title, description, video_url, duration, order_index)",
      )
      .eq("day_id", dayRow.id)
      .order("order_index");

    const weekTitle = (dayRow as { weeks?: { title?: string } | null }).weeks?.title ?? null;

    return {
      id: dayRow.id,
      day_number: dayRow.day_number,
      title: dayRow.title,
      video_url: dayRow.video_url ?? null,
      audio_url: playableAudioUrl,
      respiration_text: dayRow.respiration_text ?? null,
      reflection_text: dayRow.reflection_text ?? null,
      is_rest: dayRow.is_rest ?? false,
      week_id: dayRow.week_id ?? null,
      week_title: weekTitle,
      exercises: ((exs ?? []) as Array<{
        id: string;
        title: string;
        order_index: number;
        movements: DayMovement[] | null;
      }>).map((e) => ({
        id: e.id,
        title: e.title,
        movements: (e.movements ?? [])
          .slice()
          .sort((a, b) => a.order_index - b.order_index),
      })),
    };
  });
