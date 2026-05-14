
-- 1. Restringir listagem do bucket avatars (arquivos continuam acessíveis via CDN público por URL direta)
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;

-- 2. Revogar EXECUTE de funções SECURITY DEFINER que são apenas usadas por triggers internos
REVOKE EXECUTE ON FUNCTION public.link_media_asset(text, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.unlink_media_asset(text, text, uuid, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_day_video_asset() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_day_audio_asset() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_movement_video_asset() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_feed_media_asset() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
