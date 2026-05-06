-- Restore USAGE on internal schema for authenticated so RLS policies can call
-- internal.current_user_has_content_access(). The function itself is SECURITY DEFINER
-- and only returns boolean — safe to expose execution while keeping schema hidden from REST.
GRANT USAGE ON SCHEMA internal TO authenticated;
GRANT EXECUTE ON FUNCTION internal.current_user_has_content_access() TO authenticated;