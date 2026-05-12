ALTER TABLE public.days ADD COLUMN audio_url TEXT NULL;

CREATE OR REPLACE FUNCTION public.sync_day_audio_asset()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM public.unlink_media_asset(OLD.audio_url, 'days', OLD.id, 'audio_url');
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.audio_url IS DISTINCT FROM NEW.audio_url THEN
    PERFORM public.unlink_media_asset(OLD.audio_url, 'days', OLD.id, 'audio_url');
  END IF;

  PERFORM public.link_media_asset(NEW.audio_url, 'days', NEW.id, 'audio_url');
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trg_sync_day_audio_asset
AFTER INSERT OR UPDATE OR DELETE ON public.days
FOR EACH ROW EXECUTE FUNCTION public.sync_day_audio_asset();