UPDATE public.access_control
SET has_access = true,
    source = 'manual',
    updated_at = now()
WHERE user_id = '197353e4-a9af-43bf-b73d-99641f7d95de';