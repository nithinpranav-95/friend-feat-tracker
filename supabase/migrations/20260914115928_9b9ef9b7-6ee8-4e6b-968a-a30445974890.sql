DROP POLICY "profiles_read_group_friends" ON public.profiles;
DROP POLICY "groups_read_members" ON public.groups;
DROP POLICY "members_read_group" ON public.group_members;
DROP POLICY "games_read_group" ON public.games;
DROP POLICY "games_insert_group" ON public.games;
DROP POLICY "games_update_group" ON public.games;
DROP POLICY "games_delete_group" ON public.games;
DROP POLICY "sessions_read_group" ON public.game_sessions;
DROP POLICY "sessions_insert_group" ON public.game_sessions;
DROP POLICY "sessions_update_group" ON public.game_sessions;
DROP POLICY "sessions_delete_group" ON public.game_sessions;
DROP POLICY "session_players_read" ON public.session_players;
DROP POLICY "session_players_insert" ON public.session_players;
DROP POLICY "session_players_update" ON public.session_players;
DROP POLICY "session_players_delete" ON public.session_players;
DROP POLICY "scores_read" ON public.score_entries;
DROP POLICY "scores_insert" ON public.score_entries;
DROP POLICY "scores_update" ON public.score_entries;
DROP POLICY "scores_delete" ON public.score_entries;

DROP FUNCTION public.bootstrap_group(text);
DROP FUNCTION public.is_group_member(uuid, uuid);

CREATE POLICY "members_read_own" ON public.group_members FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "groups_read_members" ON public.groups FOR SELECT TO authenticated USING (created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = id AND gm.user_id = auth.uid()));
CREATE POLICY "profiles_read_group_friends" ON public.profiles FOR SELECT TO authenticated USING (
  id = auth.uid() OR EXISTS (
    SELECT 1 FROM public.group_members mine
    JOIN public.group_members theirs ON theirs.group_id = mine.group_id
    WHERE mine.user_id = auth.uid() AND theirs.user_id = profiles.id
  )
);
CREATE POLICY "games_read_group" ON public.games FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = games.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "games_insert_group" ON public.games FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = games.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "games_update_group" ON public.games FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = games.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "games_delete_group" ON public.games FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = games.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "sessions_read_group" ON public.game_sessions FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = game_sessions.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "sessions_insert_group" ON public.game_sessions FOR INSERT TO authenticated WITH CHECK (started_by = auth.uid() AND EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = game_sessions.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "sessions_update_group" ON public.game_sessions FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = game_sessions.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "sessions_delete_group" ON public.game_sessions FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.group_members gm WHERE gm.group_id = game_sessions.group_id AND gm.user_id = auth.uid()));
CREATE POLICY "session_players_read" ON public.session_players FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.game_sessions s JOIN public.group_members gm ON gm.group_id = s.group_id WHERE s.id = session_id AND gm.user_id = auth.uid()));
CREATE POLICY "session_players_insert" ON public.session_players FOR INSERT TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM public.game_sessions s JOIN public.group_members gm ON gm.group_id = s.group_id WHERE s.id = session_id AND gm.user_id = auth.uid()));
CREATE POLICY "session_players_update" ON public.session_players FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.game_sessions s JOIN public.group_members gm ON gm.group_id = s.group_id WHERE s.id = session_id AND gm.user_id = auth.uid()));
CREATE POLICY "session_players_delete" ON public.session_players FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.game_sessions s JOIN public.group_members gm ON gm.group_id = s.group_id WHERE s.id = session_id AND gm.user_id = auth.uid()));
CREATE POLICY "scores_read" ON public.score_entries FOR SELECT TO authenticated USING (EXISTS (SELECT 1 FROM public.game_sessions s JOIN public.group_members gm ON gm.group_id = s.group_id WHERE s.id = session_id AND gm.user_id = auth.uid()));
CREATE POLICY "scores_insert" ON public.score_entries FOR INSERT TO authenticated WITH CHECK (entered_by = auth.uid() AND EXISTS (SELECT 1 FROM public.game_sessions s JOIN public.group_members gm ON gm.group_id = s.group_id WHERE s.id = session_id AND gm.user_id = auth.uid()));
CREATE POLICY "scores_update" ON public.score_entries FOR UPDATE TO authenticated USING (EXISTS (SELECT 1 FROM public.game_sessions s JOIN public.group_members gm ON gm.group_id = s.group_id WHERE s.id = session_id AND gm.user_id = auth.uid()));
CREATE POLICY "scores_delete" ON public.score_entries FOR DELETE TO authenticated USING (EXISTS (SELECT 1 FROM public.game_sessions s JOIN public.group_members gm ON gm.group_id = s.group_id WHERE s.id = session_id AND gm.user_id = auth.uid()));

CREATE OR REPLACE FUNCTION public.after_group_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.group_members (group_id, user_id) VALUES (NEW.id, NEW.created_by);
  INSERT INTO public.games (group_id, name, scoring_type, high_score_wins, accent, is_builtin, created_by) VALUES
    (NEW.id, 'Sevens', 'points', false, 'lime', true, NEW.created_by),
    (NEW.id, 'Poker', 'points', true, 'yellow', true, NEW.created_by),
    (NEW.id, 'Uno', 'points', true, 'mint', true, NEW.created_by);
  RETURN NEW;
END; $$;
REVOKE ALL ON FUNCTION public.after_group_created() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER group_created_defaults AFTER INSERT ON public.groups FOR EACH ROW EXECUTE FUNCTION public.after_group_created();