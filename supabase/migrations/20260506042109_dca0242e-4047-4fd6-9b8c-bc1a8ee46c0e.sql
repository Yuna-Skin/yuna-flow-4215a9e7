
-- Private schema not exposed via PostgREST
CREATE SCHEMA IF NOT EXISTS internal;
REVOKE ALL ON SCHEMA internal FROM PUBLIC, anon, authenticated;
GRANT USAGE ON SCHEMA internal TO postgres, service_role;

-- Move the access-check helper into internal schema
CREATE OR REPLACE FUNCTION internal.current_user_has_content_access()
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

-- Repoint policies to internal.current_user_has_content_access
DROP POLICY IF EXISTS "Programs viewable by users with access" ON public.programs;
CREATE POLICY "Programs viewable by users with access"
  ON public.programs FOR SELECT TO authenticated
  USING (internal.current_user_has_content_access());

DROP POLICY IF EXISTS "Weeks viewable by users with access" ON public.weeks;
CREATE POLICY "Weeks viewable by users with access"
  ON public.weeks FOR SELECT TO authenticated
  USING (internal.current_user_has_content_access());

DROP POLICY IF EXISTS "Days viewable by users with access" ON public.days;
CREATE POLICY "Days viewable by users with access"
  ON public.days FOR SELECT TO authenticated
  USING (internal.current_user_has_content_access());

DROP POLICY IF EXISTS "Exercises viewable by users with access" ON public.exercises;
CREATE POLICY "Exercises viewable by users with access"
  ON public.exercises FOR SELECT TO authenticated
  USING (internal.current_user_has_content_access());

DROP POLICY IF EXISTS "Movements viewable by users with access" ON public.movements;
CREATE POLICY "Movements viewable by users with access"
  ON public.movements FOR SELECT TO authenticated
  USING (internal.current_user_has_content_access());

DROP POLICY IF EXISTS "Users with access can read videos" ON storage.objects;
CREATE POLICY "Users with access can read videos"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'videos' AND internal.current_user_has_content_access());

-- Drop the public-schema version
DROP FUNCTION IF EXISTS public.current_user_has_content_access();

-- complete_day: only authenticated, not anon
REVOKE EXECUTE ON FUNCTION public.complete_day(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_day(uuid) TO authenticated;
