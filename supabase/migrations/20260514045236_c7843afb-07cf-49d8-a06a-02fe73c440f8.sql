CREATE TABLE public.user_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  accepted_terms BOOLEAN NOT NULL DEFAULT false,
  accepted_privacy BOOLEAN NOT NULL DEFAULT false,
  terms_version TEXT NOT NULL,
  privacy_version TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_consents_user_id_accepted_at ON public.user_consents(user_id, accepted_at DESC);

ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own consents"
ON public.user_consents
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users insert own consents"
ON public.user_consents
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all consents"
ON public.user_consents
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));