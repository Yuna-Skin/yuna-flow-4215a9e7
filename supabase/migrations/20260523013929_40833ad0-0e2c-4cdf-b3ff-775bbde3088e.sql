CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_pending RECORD;
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));

  SELECT * INTO v_pending
  FROM public.pending_purchases
  WHERE lower(email) = lower(NEW.email)
    AND status = 'active'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.access_control (user_id, has_access, source, ticto_order_id)
    VALUES (NEW.id, true, 'ticto', v_pending.ticto_order_id);
  ELSE
    -- Sem compra Ticto: cria registro sem acesso. Webhook da Ticto pode liberar depois.
    INSERT INTO public.access_control (user_id, has_access, source)
    VALUES (NEW.id, false, 'pending');
  END IF;

  INSERT INTO public.user_streak (user_id, current_streak)
  VALUES (NEW.id, 0);

  RETURN NEW;
END;
$function$;