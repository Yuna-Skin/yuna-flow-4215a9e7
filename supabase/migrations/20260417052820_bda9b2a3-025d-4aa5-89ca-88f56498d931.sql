
-- =========================================
-- UTIL: updated_at trigger function
-- =========================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Praticante',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by authenticated users"
  ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- ACCESS CONTROL (Ticto simulation)
-- =========================================
CREATE TABLE public.access_control (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  has_access BOOLEAN NOT NULL DEFAULT true,
  source TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.access_control ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own access"
  ON public.access_control FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER trg_access_control_updated_at
BEFORE UPDATE ON public.access_control
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- PROGRAM CONTENT
-- =========================================
CREATE TABLE public.programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Programs viewable by authenticated"
  ON public.programs FOR SELECT TO authenticated USING (true);

CREATE TABLE public.weeks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(program_id, order_index)
);
ALTER TABLE public.weeks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Weeks viewable by authenticated"
  ON public.weeks FOR SELECT TO authenticated USING (true);

CREATE TABLE public.days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_id UUID NOT NULL REFERENCES public.weeks(id) ON DELETE CASCADE,
  day_number INT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  video_url TEXT,
  respiration_text TEXT,
  reflection_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.days ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Days viewable by authenticated"
  ON public.days FOR SELECT TO authenticated USING (true);

CREATE TABLE public.exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Exercises viewable by authenticated"
  ON public.exercises FOR SELECT TO authenticated USING (true);

CREATE TABLE public.movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_id UUID NOT NULL REFERENCES public.exercises(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT,
  order_index INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Movements viewable by authenticated"
  ON public.movements FOR SELECT TO authenticated USING (true);

-- =========================================
-- USER PROGRESS & STREAK
-- =========================================
CREATE TABLE public.user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  day_id UUID NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT true,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, day_id)
);
ALTER TABLE public.user_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own progress"
  ON public.user_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own progress"
  ON public.user_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own progress"
  ON public.user_progress FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.user_streak (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  last_completed_date DATE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.user_streak ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own streak"
  ON public.user_streak FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own streak"
  ON public.user_streak FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own streak"
  ON public.user_streak FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- =========================================
-- COMMUNITY
-- =========================================
CREATE TABLE public.community_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  likes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Posts viewable by authenticated"
  ON public.community_posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own posts"
  ON public.community_posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own posts"
  ON public.community_posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own posts"
  ON public.community_posts FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.post_likes (
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(post_id, user_id)
);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes viewable by authenticated"
  ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users like as themselves"
  ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own like"
  ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments viewable by authenticated"
  ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own comments"
  ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments"
  ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Triggers to maintain post likes_count
CREATE OR REPLACE FUNCTION public.increment_post_likes()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.community_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;$$;

CREATE OR REPLACE FUNCTION public.decrement_post_likes()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.community_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
  RETURN OLD;
END;$$;

CREATE TRIGGER trg_post_like_inc AFTER INSERT ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.increment_post_likes();
CREATE TRIGGER trg_post_like_dec AFTER DELETE ON public.post_likes
FOR EACH ROW EXECUTE FUNCTION public.decrement_post_likes();

-- =========================================
-- FEED
-- =========================================
CREATE TABLE public.feed_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('video','tip','text')),
  title TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  likes_count INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.feed_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Feed viewable by authenticated"
  ON public.feed_items FOR SELECT TO authenticated USING (true);

CREATE TABLE public.feed_likes (
  feed_item_id UUID NOT NULL REFERENCES public.feed_items(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY(feed_item_id, user_id)
);
ALTER TABLE public.feed_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Feed likes viewable by authenticated"
  ON public.feed_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users like feed as themselves"
  ON public.feed_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users remove own feed like"
  ON public.feed_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.increment_feed_likes()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.feed_items SET likes_count = likes_count + 1 WHERE id = NEW.feed_item_id;
  RETURN NEW;
END;$$;

CREATE OR REPLACE FUNCTION public.decrement_feed_likes()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  UPDATE public.feed_items SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.feed_item_id;
  RETURN OLD;
END;$$;

CREATE TRIGGER trg_feed_like_inc AFTER INSERT ON public.feed_likes
FOR EACH ROW EXECUTE FUNCTION public.increment_feed_likes();
CREATE TRIGGER trg_feed_like_dec AFTER DELETE ON public.feed_likes
FOR EACH ROW EXECUTE FUNCTION public.decrement_feed_likes();

-- =========================================
-- SIGNUP TRIGGER: profile + access + streak
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));

  INSERT INTO public.access_control (user_id, has_access, source)
  VALUES (NEW.id, true, 'default');

  INSERT INTO public.user_streak (user_id, current_streak)
  VALUES (NEW.id, 0);

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- COMPLETE DAY RPC (atomic progress + streak)
-- =========================================
CREATE OR REPLACE FUNCTION public.complete_day(p_day_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user UUID := auth.uid();
  v_today DATE := CURRENT_DATE;
  v_last DATE;
  v_streak INT;
  v_new_streak INT;
BEGIN
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.user_progress (user_id, day_id, completed, completed_at)
  VALUES (v_user, p_day_id, true, now())
  ON CONFLICT (user_id, day_id) DO UPDATE SET completed = true, completed_at = now();

  SELECT last_completed_date, current_streak INTO v_last, v_streak
  FROM public.user_streak WHERE user_id = v_user;

  IF v_last IS NULL THEN
    v_new_streak := 1;
  ELSIF v_last = v_today THEN
    v_new_streak := v_streak;
  ELSIF v_last = v_today - INTERVAL '1 day' THEN
    v_new_streak := v_streak + 1;
  ELSE
    v_new_streak := 1;
  END IF;

  INSERT INTO public.user_streak (user_id, current_streak, last_completed_date, updated_at)
  VALUES (v_user, v_new_streak, v_today, now())
  ON CONFLICT (user_id) DO UPDATE
    SET current_streak = v_new_streak, last_completed_date = v_today, updated_at = now();

  RETURN json_build_object('streak', v_new_streak);
END;
$$;

-- =========================================
-- SEED: 1 program -> 4 weeks -> 28 days
-- =========================================
DO $$
DECLARE
  v_program_id UUID;
  v_week_id UUID;
  v_day_id UUID;
  v_ex_id UUID;
  d INT;
  w INT;
  v_titles TEXT[] := ARRAY[
    'Despertar Suave','Alongamento da Coluna','Equilíbrio Interior','Respiração Profunda','Força Tranquila','Fluidez do Corpo','Descanso Consciente',
    'Abertura do Peito','Quadris Livres','Coluna Flexível','Pernas Fortes','Core Estável','Ombros Leves','Relaxamento Total',
    'Meditação em Movimento','Postura Real','Energia Vital','Foco e Presença','Confiança Corporal','Gratidão em Prática','Renovação',
    'Integração Profunda','Caminho do Mestre','Harmonia Completa','Sabedoria do Corpo','Floresta Interior','Lago Sereno','Celebração Final'
  ];
  v_reflections TEXT[] := ARRAY[
    'Comece o dia se conectando com sua respiração.',
    'Cada movimento é um convite à presença.',
    'O equilíbrio nasce da escuta interna.',
    'Sua respiração é seu refúgio.',
    'Força verdadeira é gentil.',
    'Flua como água, firme como montanha.',
    'Descansar também é praticar.',
    'Abra o peito, abra o coração.',
    'Liberte o que não te serve mais.',
    'A coluna é o eixo da sua energia.',
    'Suas pernas te sustentam — agradeça-as.',
    'O centro é o lar do seu poder.',
    'Solte o peso que não é seu.',
    'Permita-se descansar profundamente.',
    'Movimento é meditação.',
    'Postura nobre, mente clara.',
    'Sinta a energia vital fluindo.',
    'Foco no agora, presença no corpo.',
    'Confie no seu corpo.',
    'Agradeça cada respiração.',
    'A cada dia, uma versão renovada.',
    'Você é a soma de todas as suas práticas.',
    'O caminho é o destino.',
    'Tudo está em harmonia.',
    'Seu corpo sabe.',
    'Cultive sua floresta interior.',
    'Mente como lago: claro e sereno.',
    'Celebre essa jornada de 28 dias.'
  ];
  v_resp TEXT := 'Inspire em 4 tempos pelo nariz, segure por 4, expire em 6 pela boca. Repita 5 ciclos.';
  v_video TEXT := 'https://www.youtube.com/embed/v7AYKMP6rOE';
BEGIN
  INSERT INTO public.programs (title, description)
  VALUES ('Yuna 28 dias', 'Protocolo de Yoga Coreano em 28 dias para criar o hábito da prática diária.')
  RETURNING id INTO v_program_id;

  FOR w IN 1..4 LOOP
    INSERT INTO public.weeks (program_id, title, order_index)
    VALUES (v_program_id, 'Semana ' || w, w)
    RETURNING id INTO v_week_id;

    FOR d IN 1..7 LOOP
      INSERT INTO public.days (week_id, day_number, title, video_url, respiration_text, reflection_text)
      VALUES (
        v_week_id,
        (w-1)*7 + d,
        'Dia ' || ((w-1)*7 + d) || ' — ' || v_titles[(w-1)*7 + d],
        v_video,
        v_resp,
        v_reflections[(w-1)*7 + d]
      )
      RETURNING id INTO v_day_id;

      -- Exercise 1: Aquecimento
      INSERT INTO public.exercises (day_id, title, order_index)
      VALUES (v_day_id, 'Aquecimento', 1) RETURNING id INTO v_ex_id;
      INSERT INTO public.movements (exercise_id, title, description, order_index) VALUES
        (v_ex_id, 'Rotação de pescoço', 'Gire o pescoço lentamente, 5 vezes para cada lado.', 1),
        (v_ex_id, 'Mobilidade de ombros', 'Círculos com os ombros, 10 repetições.', 2);

      -- Exercise 2: Prática principal
      INSERT INTO public.exercises (day_id, title, order_index)
      VALUES (v_day_id, 'Prática principal', 2) RETURNING id INTO v_ex_id;
      INSERT INTO public.movements (exercise_id, title, description, order_index) VALUES
        (v_ex_id, 'Postura da montanha', 'Em pé, pés alinhados, coluna ereta. Mantenha por 1 minuto.', 1),
        (v_ex_id, 'Cão olhando para baixo', 'Forme um V invertido com o corpo. 5 respirações profundas.', 2),
        (v_ex_id, 'Postura da criança', 'Joelhos no chão, tronco à frente, braços estendidos. Relaxe por 2 minutos.', 3);

      -- Exercise 3: Finalização
      INSERT INTO public.exercises (day_id, title, order_index)
      VALUES (v_day_id, 'Finalização', 3) RETURNING id INTO v_ex_id;
      INSERT INTO public.movements (exercise_id, title, description, order_index) VALUES
        (v_ex_id, 'Savasana', 'Deite-se de costas, palmas para cima. Relaxe por 3 minutos.', 1);
    END LOOP;
  END LOOP;
END $$;

-- =========================================
-- SEED FEED
-- =========================================
INSERT INTO public.feed_items (type, title, content, media_url) VALUES
  ('tip', 'Hidrate-se bem', 'Beba água ao acordar para ativar o metabolismo e preparar o corpo para a prática.', NULL),
  ('text', 'Yoga Coreano', 'Yoga coreano combina movimentos suaves, respiração consciente e meditação. É uma prática completa.', NULL),
  ('video', 'Respiração 4-4-6', 'Aprenda a técnica que acalma o sistema nervoso em minutos.', 'https://www.youtube.com/embed/v7AYKMP6rOE'),
  ('tip', 'Pratique no mesmo horário', 'Criar uma rotina facilita o hábito. Escolha um horário e mantenha.', NULL),
  ('text', 'Sobre o desafio', '28 dias é o tempo médio para criar um novo hábito. Confie no processo.', NULL),
  ('video', 'Postura da montanha', 'A base de toda prática começa nessa postura simples e poderosa.', 'https://www.youtube.com/embed/v7AYKMP6rOE');
