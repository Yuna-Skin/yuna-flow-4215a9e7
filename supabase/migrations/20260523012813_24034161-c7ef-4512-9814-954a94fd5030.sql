-- 1) pending_purchases
CREATE TABLE public.pending_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  status text NOT NULL DEFAULT 'active',
  ticto_order_id text NOT NULL UNIQUE,
  product_id text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_pending_purchases_email ON public.pending_purchases(lower(email));
ALTER TABLE public.pending_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pending purchases"
  ON public.pending_purchases FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE TRIGGER pending_purchases_updated_at
  BEFORE UPDATE ON public.pending_purchases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) ticto_webhook_events
CREATE TABLE public.ticto_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticto_event_id text UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ticto_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view webhook events"
  ON public.ticto_webhook_events FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3) access_control: nova coluna
ALTER TABLE public.access_control ADD COLUMN ticto_order_id text;
CREATE INDEX idx_access_control_ticto_order ON public.access_control(ticto_order_id);

-- 4) handle_new_user: liberar acesso se houver compra pendente
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
    INSERT INTO public.access_control (user_id, has_access, source)
    VALUES (NEW.id, true, 'default');
  END IF;

  INSERT INTO public.user_streak (user_id, current_streak)
  VALUES (NEW.id, 0);

  RETURN NEW;
END;
$function$;