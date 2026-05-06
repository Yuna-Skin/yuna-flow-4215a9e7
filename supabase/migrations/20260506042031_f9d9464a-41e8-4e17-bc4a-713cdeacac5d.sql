
-- 1. Helper: check if the current user has access (admin OR access_control.has_access = true)
CREATE OR REPLACE FUNCTION public.current_user_has_content_access()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.access_control
      WHERE user_id = auth.uid() AND has_access = true
    );
$$;

-- 2. Replace permissive SELECT policies on content tables
DROP POLICY IF EXISTS "Programs viewable by authenticated" ON public.programs;
CREATE POLICY "Programs viewable by users with access"
  ON public.programs FOR SELECT TO authenticated
  USING (public.current_user_has_content_access());

DROP POLICY IF EXISTS "Weeks viewable by authenticated" ON public.weeks;
CREATE POLICY "Weeks viewable by users with access"
  ON public.weeks FOR SELECT TO authenticated
  USING (public.current_user_has_content_access());

DROP POLICY IF EXISTS "Days viewable by authenticated" ON public.days;
CREATE POLICY "Days viewable by users with access"
  ON public.days FOR SELECT TO authenticated
  USING (public.current_user_has_content_access());

DROP POLICY IF EXISTS "Exercises viewable by authenticated" ON public.exercises;
CREATE POLICY "Exercises viewable by users with access"
  ON public.exercises FOR SELECT TO authenticated
  USING (public.current_user_has_content_access());

DROP POLICY IF EXISTS "Movements viewable by authenticated" ON public.movements;
CREATE POLICY "Movements viewable by users with access"
  ON public.movements FOR SELECT TO authenticated
  USING (public.current_user_has_content_access());

-- 3. Make videos bucket private
UPDATE storage.buckets SET public = false WHERE id = 'videos';

-- Allow users with access to read video files via signed URLs / authenticated requests
CREATE POLICY "Users with access can read videos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'videos' AND public.current_user_has_content_access());

-- 4. Realtime authorization: only admins can subscribe on media_* topics
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read media realtime" ON realtime.messages;
CREATE POLICY "Admins read media realtime"
  ON realtime.messages FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::app_role)
    AND (realtime.topic() LIKE 'media_assets%' OR realtime.topic() LIKE 'media_asset_links%')
  );

-- 5. Lock down SECURITY DEFINER functions: revoke from public/anon/authenticated
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_media_asset(text, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unlink_media_asset(text, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.media_path_from_url(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_day_video_asset() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_movement_video_asset() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_feed_media_asset() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_post_likes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_post_likes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.increment_feed_likes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_feed_likes() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_user_has_content_access() FROM PUBLIC, anon;

-- complete_day must remain callable by authenticated users
GRANT EXECUTE ON FUNCTION public.complete_day(uuid) TO authenticated;
