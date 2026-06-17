
-- Restrict media_assets SELECT to admins or users with content access
DROP POLICY IF EXISTS "Media assets viewable by authenticated" ON public.media_assets;
CREATE POLICY "Media assets viewable by content access" ON public.media_assets
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR internal.current_user_has_content_access());

-- Restrict media_asset_links SELECT to admins or users with content access
DROP POLICY IF EXISTS "Media asset links viewable by authenticated" ON public.media_asset_links;
CREATE POLICY "Media asset links viewable by content access" ON public.media_asset_links
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR internal.current_user_has_content_access());

-- Tighten legal_audit_logs INSERT policy: require non-null user_id matching auth.uid()
DROP POLICY IF EXISTS "Users insert own legal audit logs" ON public.legal_audit_logs;
CREATE POLICY "Users insert own legal audit logs" ON public.legal_audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id IS NOT NULL AND auth.uid() = user_id);
