-- 1) Remover política duplicada de INSERT em comments (se existir)
DROP POLICY IF EXISTS "Users create own comments" ON public.comments;

-- 2) Revogar EXECUTE de funções SECURITY DEFINER que só devem rodar via trigger
REVOKE EXECUTE ON FUNCTION public.sync_day_video_asset() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_movement_video_asset() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_feed_media_asset() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_day_audio_asset() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.link_media_asset(text, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unlink_media_asset(text, text, uuid, text) FROM PUBLIC, anon, authenticated;