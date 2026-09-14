CREATE TYPE public.scoring_type AS ENUM ('points', 'win_loss', 'ranked');
CREATE TYPE public.session_status AS ENUM ('active', 'completed', 'cancelled');

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 40),
  spirit_animal text NOT NULL DEFAULT 'fox',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "profiles_delete_own" ON public.profiles FOR DELETE TO authenticated USING (id = auth.uid());
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 60),
  invite_code text NOT NULL UNIQUE DEFAULT upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.group_members (
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  joined_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.group_members TO authenticated;
GRANT ALL ON public.group_members TO service_role;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_group_member(_group_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.group_members WHERE group_id = _group_id AND user_id = _user_id)
$$;
GRANT EXECUTE ON FUNCTION public.is_group_member(uuid, uuid) TO authenticated;

CREATE POLICY "profiles_read_group_friends" ON public.profiles FOR SELECT TO authenticated USING (
  id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.group_members mine
    JOIN public.group_members theirs ON theirs.group_id = mine.group_id
    WHERE mine.user_id = auth.uid() AND theirs.user_id = profiles.id
  )
);
CREATE POLICY "groups_insert_own" ON public.groups FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY "groups_read_members" ON public.groups FOR SELECT TO authenticated USING (public.is_group_member(id));
CREATE POLICY "groups_update_owner" ON public.groups FOR UPDATE TO authenticated USING (created_by = auth.uid()) WITH CHECK (created_by = auth.uid());
CREATE POLICY "groups_delete_owner" ON public.groups FOR DELETE TO authenticated USING (created_by = auth.uid());
CREATE POLICY "members_read_group" ON public.group_members FOR SELECT TO authenticated USING (public.is_group_member(group_id));
CREATE POLICY "members_join_self" ON public.group_members FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY "members_leave_self" ON public.group_members FOR DELETE TO authenticated USING (user_id = auth.uid());
CREATE TRIGGER groups_updated_at BEFORE UPDATE ON public.groups FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  name text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 50),
  scoring_type public.scoring_type NOT NULL,
  high_score_wins boolean NOT NULL DEFAULT true,
  accent text NOT NULL DEFAULT 'lime',
  is_builtin boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (group_id, name)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.games TO authenticated;
GRANT ALL ON public.games TO service_role;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "games_read_group" ON public.games FOR SELECT TO authenticated USING (public.is_group_member(group_id));
CREATE POLICY "games_insert_group" ON public.games FOR INSERT TO authenticated WITH CHECK (public.is_group_member(group_id) AND created_by = auth.uid());
CREATE POLICY "games_update_group" ON public.games FOR UPDATE TO authenticated USING (public.is_group_member(group_id)) WITH CHECK (public.is_group_member(group_id));
CREATE POLICY "games_delete_group" ON public.games FOR DELETE TO authenticated USING (public.is_group_member(group_id));

CREATE TABLE public.game_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE RESTRICT,
  status public.session_status NOT NULL DEFAULT 'active',
  started_by uuid NOT NULL,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.game_sessions TO authenticated;
GRANT ALL ON public.game_sessions TO service_role;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sessions_read_group" ON public.game_sessions FOR SELECT TO authenticated USING (public.is_group_member(group_id));
CREATE POLICY "sessions_insert_group" ON public.game_sessions FOR INSERT TO authenticated WITH CHECK (public.is_group_member(group_id) AND started_by = auth.uid());
CREATE POLICY "sessions_update_group" ON public.game_sessions FOR UPDATE TO authenticated USING (public.is_group_member(group_id)) WITH CHECK (public.is_group_member(group_id));
CREATE POLICY "sessions_delete_group" ON public.game_sessions FOR DELETE TO authenticated USING (public.is_group_member(group_id));
CREATE TRIGGER sessions_updated_at BEFORE UPDATE ON public.game_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.session_players (
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  final_score numeric NOT NULL DEFAULT 0,
  final_rank integer,
  is_winner boolean NOT NULL DEFAULT false,
  PRIMARY KEY (session_id, player_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.session_players TO authenticated;
GRANT ALL ON public.session_players TO service_role;
ALTER TABLE public.session_players ENABLE ROW LEVEL SECURITY;
CREATE POLICY "session_players_read" ON public.session_players FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND public.is_group_member(s.group_id)));
CREATE POLICY "session_players_insert" ON public.session_players FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND public.is_group_member(s.group_id)));
CREATE POLICY "session_players_update" ON public.session_players FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND public.is_group_member(s.group_id)));
CREATE POLICY "session_players_delete" ON public.session_players FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND public.is_group_member(s.group_id)));

CREATE TABLE public.score_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.game_sessions(id) ON DELETE CASCADE,
  player_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  round_number integer NOT NULL CHECK (round_number > 0),
  score numeric NOT NULL DEFAULT 0,
  entered_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, player_id, round_number)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.score_entries TO authenticated;
GRANT ALL ON public.score_entries TO service_role;
ALTER TABLE public.score_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scores_read" ON public.score_entries FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND public.is_group_member(s.group_id)));
CREATE POLICY "scores_insert" ON public.score_entries FOR INSERT TO authenticated WITH CHECK (entered_by = auth.uid() AND EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND public.is_group_member(s.group_id)));
CREATE POLICY "scores_update" ON public.score_entries FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND public.is_group_member(s.group_id)));
CREATE POLICY "scores_delete" ON public.score_entries FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.game_sessions s WHERE s.id = session_id AND public.is_group_member(s.group_id)));

CREATE OR REPLACE FUNCTION public.bootstrap_group(_name text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE new_group_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  INSERT INTO public.groups (name, created_by) VALUES (_name, auth.uid()) RETURNING id INTO new_group_id;
  INSERT INTO public.group_members (group_id, user_id) VALUES (new_group_id, auth.uid());
  INSERT INTO public.games (group_id, name, scoring_type, high_score_wins, accent, is_builtin, created_by) VALUES
    (new_group_id, 'Sevens', 'points', false, 'lime', true, auth.uid()),
    (new_group_id, 'Poker', 'points', true, 'yellow', true, auth.uid()),
    (new_group_id, 'Uno', 'points', true, 'mint', true, auth.uid());
  RETURN new_group_id;
END; $$;
GRANT EXECUTE ON FUNCTION public.bootstrap_group(text) TO authenticated;

CREATE INDEX group_members_user_idx ON public.group_members(user_id);
CREATE INDEX games_group_idx ON public.games(group_id);
CREATE INDEX sessions_group_started_idx ON public.game_sessions(group_id, started_at DESC);
CREATE INDEX score_entries_session_round_idx ON public.score_entries(session_id, round_number);