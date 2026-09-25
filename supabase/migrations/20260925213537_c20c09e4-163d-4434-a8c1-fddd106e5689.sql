CREATE TABLE public.players (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  spirit_animal text NOT NULL DEFAULT 'fox',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.players TO authenticated;
GRANT ALL ON public.players TO service_role;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "players_shared_all" ON public.players FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

CREATE TABLE public.game_results (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_name text NOT NULL,
  played_at timestamptz NOT NULL DEFAULT now(),
  rounds integer NOT NULL DEFAULT 1,
  results jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_results TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_results TO authenticated;
GRANT ALL ON public.game_results TO service_role;
ALTER TABLE public.game_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "game_results_shared_all" ON public.game_results FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);