
-- Limpa policies antigas que possam permitir acesso amplo ao bucket avatars
DO $$
DECLARE p RECORD;
BEGIN
  FOR p IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='storage' AND tablename='objects'
      AND policyname ILIKE '%avatar%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

-- Leitura pública individual (URL pública continua funcionando), mas SEM listagem ampla:
-- só permite SELECT quando o caminho começa com uma pasta UUID (i.e. /{user_id}/...).
CREATE POLICY "Avatars: public read of user folders"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] IS NOT NULL
);

-- Upload: apenas usuário autenticado, dentro da própria pasta
CREATE POLICY "Avatars: users upload own folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Update: apenas dono
CREATE POLICY "Avatars: users update own folder"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Delete: apenas dono
CREATE POLICY "Avatars: users delete own folder"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
