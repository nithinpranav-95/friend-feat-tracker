ALTER TABLE public.players ADD COLUMN quote text;

CREATE TABLE public.custom_games (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  scoring_type text NOT NULL DEFAULT 'points',
  high_score_wins boolean NOT NULL DEFAULT true,
  accent text NOT NULL DEFAULT 'lime',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_games TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_games TO authenticated;
GRANT ALL ON public.custom_games TO service_role;
ALTER TABLE public.custom_games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "custom_games_shared_all" ON public.custom_games FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);