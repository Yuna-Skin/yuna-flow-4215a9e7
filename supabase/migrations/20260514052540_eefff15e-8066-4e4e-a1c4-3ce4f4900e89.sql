-- Tabela de logs jurídicos / auditoria LGPD
CREATE TABLE public.legal_audit_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NULL,
  event_type text NOT NULL,
  ip_address text NULL,
  user_agent text NULL,
  terms_version text NULL,
  privacy_version text NULL,
  marketing_consent boolean NULL,
  metadata jsonb NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_legal_audit_logs_user_id ON public.legal_audit_logs(user_id);
CREATE INDEX idx_legal_audit_logs_event_type ON public.legal_audit_logs(event_type);
CREATE INDEX idx_legal_audit_logs_created_at ON public.legal_audit_logs(created_at DESC);

ALTER TABLE public.legal_audit_logs ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler. Inserts são feitos via service role (server functions).
CREATE POLICY "Admins view audit logs"
  ON public.legal_audit_logs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Sem policies de INSERT/UPDATE/DELETE para usuárias — só service role escreve.
-- Isso garante imutabilidade do ponto de vista do cliente (proteção contra alteração indevida).