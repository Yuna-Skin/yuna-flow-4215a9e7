
-- 1. Status enum
DO $$ BEGIN
  CREATE TYPE public.post_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Add columns
ALTER TABLE public.community_posts
  ADD COLUMN IF NOT EXISTS status public.post_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid;

CREATE INDEX IF NOT EXISTS idx_community_posts_status ON public.community_posts(status, created_at DESC);

-- 3. Replace SELECT policy: approved-only for everyone, own posts always visible, admins/mods see all
DROP POLICY IF EXISTS "Posts viewable by authenticated" ON public.community_posts;

CREATE POLICY "View approved posts or own"
ON public.community_posts
FOR SELECT
TO authenticated
USING (
  status = 'approved'
  OR auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'moderator')
);

-- 4. Admin/moderator update policy (status changes)
DROP POLICY IF EXISTS "Admins moderate posts" ON public.community_posts;
CREATE POLICY "Admins moderate posts"
ON public.community_posts
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

-- 5. Force user_id and status on insert (clients can't pre-approve their own posts)
CREATE OR REPLACE FUNCTION public.community_posts_before_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.user_id := auth.uid();
  NEW.status := 'pending';
  NEW.reviewed_at := NULL;
  NEW.reviewed_by := NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_posts_before_insert ON public.community_posts;
CREATE TRIGGER community_posts_before_insert
  BEFORE INSERT ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.community_posts_before_insert();

-- 6. Track reviewer on status change
CREATE OR REPLACE FUNCTION public.community_posts_before_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.reviewed_at := now();
    NEW.reviewed_by := auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS community_posts_before_update ON public.community_posts;
CREATE TRIGGER community_posts_before_update
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW EXECUTE FUNCTION public.community_posts_before_update();

-- 7. Comments only on approved posts
DROP POLICY IF EXISTS "Users create comments on approved posts" ON public.comments;
CREATE POLICY "Users create comments on approved posts"
ON public.comments
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.community_posts p
    WHERE p.id = comments.post_id AND p.status = 'approved'
  )
);
