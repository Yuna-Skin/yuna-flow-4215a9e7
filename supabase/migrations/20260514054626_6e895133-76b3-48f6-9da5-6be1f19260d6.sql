-- Adiciona suporte a dias de descanso (fim de semana) no protocolo de 28 dias
ALTER TABLE public.days
  ADD COLUMN IF NOT EXISTS is_rest boolean NOT NULL DEFAULT false;

-- Insere 2 dias de descanso (6 = sábado, 7 = domingo) por semana, se ainda não existirem
INSERT INTO public.days (week_id, day_number, title, is_rest)
SELECT w.id, dn, 'Descanso', true
FROM public.weeks w
CROSS JOIN (VALUES (6), (7)) AS d(dn)
WHERE NOT EXISTS (
  SELECT 1 FROM public.days d2
  WHERE d2.week_id = w.id AND d2.day_number = d.dn
);