import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  ArrowUpDown,
  BarChart3,
  Check,
  CirclePlus,
  Gamepad2,
  History,
  Minus,
  Pencil,
  Play,
  Plus,
  Trash2,
  Trophy,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ScoreUp — Game Night Scorekeeper" },
      {
        name: "description",
        content: "Track live rounds, friend-group rankings and every game-night victory.",
      },
      { property: "og:title", content: "ScoreUp — Game Night Scorekeeper" },
      {
        property: "og:description",
        content: "Track live rounds, friend-group rankings and every game-night victory.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ScoreUp,
});

type Tab = "play" | "players" | "ranks" | "stats" | "history";
type Game = {
  id: string;
  name: string;
  scoring_type: string;
  high_score_wins: boolean;
  accent: string;
};
type Player = {
  id: string;
  display_name: string;
  spirit_animal: string;
  quote?: string | undefined;
};
type LivePlayer = Player & { score: number };
type PastSession = {
  id: string;
  gameName: string;
  date: string;
  rounds: number;
  results: { playerId: string; name: string; score: number; rank: number }[];
};

type AnimalInfo = {
  emoji: string;
  title: string;
  defaultQuote: string;
  badgeBg: string;
};

const spiritAnimals: Record<string, AnimalInfo> = {
  lion: {
    emoji: "🦁",
    title: "Brave Lion",
    defaultQuote: "Bold & fearless",
    badgeBg: "from-amber-500/25 to-orange-500/10 border-orange-500/30 text-orange-400",
  },
  fox: {
    emoji: "🦊",
    title: "Clever Fox",
    defaultQuote: "Tactical & cunning",
    badgeBg: "from-orange-500/25 to-amber-500/10 border-amber-500/30 text-amber-400",
  },
  panda: {
    emoji: "🐼",
    title: "Chill Panda",
    defaultQuote: "Calm under pressure",
    badgeBg: "from-slate-400/25 to-zinc-500/10 border-slate-400/30 text-slate-300",
  },
  owl: {
    emoji: "🦉",
    title: "Wise Owl",
    defaultQuote: "Master strategist",
    badgeBg: "from-purple-500/25 to-indigo-500/10 border-purple-500/30 text-purple-400",
  },
  dragon: {
    emoji: "🐲",
    title: "Mythic Dragon",
    defaultQuote: "High stakes legend",
    badgeBg: "from-cyan-500/25 to-blue-500/10 border-cyan-500/30 text-cyan-400",
  },
  chameleon: {
    emoji: "🦎",
    title: "Chameleon",
    defaultQuote: "Adapts to any game",
    badgeBg: "from-teal-500/25 to-emerald-500/10 border-teal-500/30 text-teal-400",
  },
  tiger: {
    emoji: "🐯",
    title: "Fierce Tiger",
    defaultQuote: "Eyes on the prize",
    badgeBg: "from-yellow-500/25 to-amber-500/10 border-yellow-500/30 text-yellow-400",
  },
  bear: {
    emoji: "🐻",
    title: "Grizzly Bear",
    defaultQuote: "Unstoppable force",
    badgeBg: "from-amber-800/25 to-stone-700/10 border-amber-700/30 text-amber-300",
  },
  frog: {
    emoji: "🐸",
    title: "Lucky Frog",
    defaultQuote: "Leaping to victory",
    badgeBg: "from-emerald-500/25 to-green-500/10 border-emerald-500/30 text-emerald-400",
  },
  octopus: {
    emoji: "🐙",
    title: "Galaxy Octopus",
    defaultQuote: "Eight steps ahead",
    badgeBg: "from-rose-500/25 to-pink-500/10 border-rose-500/30 text-rose-400",
  },
  turtle: {
    emoji: "🐢",
    title: "Zen Turtle",
    defaultQuote: "Slow and steady wins",
    badgeBg: "from-green-500/25 to-teal-500/10 border-teal-500/30 text-green-400",
  },
  wolf: {
    emoji: "🐺",
    title: "Lone Wolf",
    defaultQuote: "Quietly dominant",
    badgeBg: "from-blue-500/25 to-indigo-500/10 border-blue-500/30 text-blue-400",
  },
};

const animals: Record<string, string> = Object.fromEntries(
  Object.entries(spiritAnimals).map(([k, v]) => [k, v.emoji]),
);
const demoPlayers: Player[] = [];
const demoGames: Game[] = [
  { id: "sevens", name: "Sevens", scoring_type: "points", high_score_wins: false, accent: "lime" },
  { id: "poker", name: "Poker", scoring_type: "points", high_score_wins: true, accent: "yellow" },
  { id: "uno", name: "Uno", scoring_type: "points", high_score_wins: true, accent: "mint" },
];

function ScoreUp() {
  return <GameApp />;
}

type PlayerStat = {
  id: string;
  name: string;
  animal: string;
  games: number;
  wins: number;
  rate: number;
  points: number;
  streak: number;
  favourite: string;
  scores: number[];
};

function playerStats(players: Player[], sessions: PastSession[]): PlayerStat[] {
  return players
    .map((p) => {
      const rows = sessions.flatMap((s) => {
        const r = s.results.find((x) => x.playerId === p.id);
        return r ? [{ gameName: s.gameName, score: r.score, rank: r.rank }] : [];
      });
      const wins = rows.filter((r) => r.rank === 1).length;
      let streak = 0;
      for (const r of rows) {
        if (r.rank === 1) streak++;
        else break;
      }
      const counts = rows.reduce<Record<string, number>>(
        (acc, r) => ({ ...acc, [r.gameName]: (acc[r.gameName] ?? 0) + 1 }),
        {},
      );
      return {
        id: p.id,
        name: p.display_name,
        animal: p.spirit_animal,
        games: rows.length,
        wins,
        rate: rows.length ? Math.round((wins / rows.length) * 100) : 0,
        points: rows.reduce((sum, r) => sum + r.score, 0),
        streak,
        favourite: Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—",
        scores: [...rows].reverse().map((r) => r.score),
      };
    })
    .sort((a, b) => b.wins - a.wins || b.points - a.points || a.name.localeCompare(b.name));
}

function GameApp() {
  const [tab, setTab] = useState<Tab>("play");
  const [games, setGames] = useState<Game[]>(demoGames);
  const [players, setPlayers] = useState<Player[]>(demoPlayers);
  const [setupGame, setSetupGame] = useState<Game | null>(null);
  const [pendingGame, setPendingGame] = useState<Game | null>(null);
  const [liveGame, setLiveGame] = useState<Game | null>(null);
  const [livePlayers, setLivePlayers] = useState<LivePlayer[]>([]);
  const [round, setRound] = useState(1);
  const [celebrate, setCelebrate] = useState(false);
  const [newGame, setNewGame] = useState(false);
  const [addPlayer, setAddPlayer] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<PastSession[]>([]);

  // Load shared data from the cloud on mount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [playersRes, gamesRes, resultsRes] = await Promise.all([
        supabase.from("players").select("*").order("created_at"),
        supabase.from("custom_games").select("*").order("created_at"),
        supabase.from("game_results").select("*").order("played_at", { ascending: false }),
      ]);
      if (cancelled) return;
      if (playersRes.data) {
        setPlayers(
          playersRes.data.map((r) => ({
            id: r.id,
            display_name: r.name,
            spirit_animal: r.spirit_animal,
            quote: r.quote ?? undefined,
          })),
        );
      }
      if (gamesRes.data && gamesRes.data.length > 0) {
        setGames([
          ...demoGames,
          ...gamesRes.data.map((g) => ({
            id: g.id,
            name: g.name,
            scoring_type: g.scoring_type,
            high_score_wins: g.high_score_wins,
            accent: g.accent,
          })),
        ]);
      }
      if (resultsRes.data) {
        setSessions(
          resultsRes.data.map((r) => ({
            id: r.id,
            gameName: r.game_name,
            date: new Date(r.played_at).toLocaleDateString(undefined, {
              day: "numeric",
              month: "short",
            }),
            rounds: r.rounds,
            results: (r.results as PastSession["results"]) ?? [],
          })),
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSelectGame(game: Game) {
    if (players.length === 0) {
      setPendingGame(game);
      setAddPlayer(true);
      return;
    }
    setSetupGame(game);
  }

  async function handleAddPlayer(name: string, animal: string, quote?: string) {
    const defaultQuote = spiritAnimals[animal]?.defaultQuote || "Bold & fearless";
    const finalQuote = quote?.trim() || defaultQuote;
    const { data, error } = await supabase
      .from("players")
      .insert({ name, spirit_animal: animal, quote: finalQuote })
      .select()
      .single();
    const newP: Player = data
      ? { id: data.id, display_name: data.name, spirit_animal: data.spirit_animal, quote: data.quote ?? undefined }
      : { id: crypto.randomUUID(), display_name: name, spirit_animal: animal, quote: finalQuote };
    if (error) console.debug("Failed to save player:", error);
    setPlayers((prev) => [...prev, newP]);
    setAddPlayer(false);
    if (pendingGame) {
      setSetupGame(pendingGame);
      setPendingGame(null);
    }
  }

  async function handleUpdatePlayer(updated: Player) {
    setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    setEditingPlayer(null);
    const { error } = await supabase
      .from("players")
      .update({ name: updated.display_name, spirit_animal: updated.spirit_animal, quote: updated.quote ?? null })
      .eq("id", updated.id);
    if (error) console.debug("Failed to update player:", error);
  }

  async function handleDeletePlayer(id: string) {
    setPlayers((prev) => prev.filter((p) => p.id !== id));
    setEditingPlayer(null);
    if (profileId === id) setProfileId(null);
    const { error } = await supabase.from("players").delete().eq("id", id);
    if (error) console.debug("Failed to delete player:", error);
  }

  function startSessionWithPlayers(game: Game, selectedPlayers: Player[]) {
    setLiveGame(game);
    setLivePlayers(selectedPlayers.map((p) => ({ ...p, score: 0 })));
    setRound(1);
    setSetupGame(null);
  }

  function addBenchPlayerToLive(player: Player) {
    setLivePlayers((list) => {
      if (list.some((p) => p.id === player.id)) return list;
      return [...list, { ...player, score: 0 }];
    });
  }

  function adjust(id: string, by: number) {
    setLivePlayers((list) => list.map((p) => (p.id === id ? { ...p, score: p.score + by } : p)));
  }
  function setScore(id: string, score: number) {
    setLivePlayers((list) => list.map((p) => (p.id === id ? { ...p, score } : p)));
  }
  async function endGame() {
    if (liveGame) {
      const ordered = [...livePlayers].sort((a, b) =>
        liveGame.high_score_wins ? b.score - a.score : a.score - b.score,
      );
      const results = ordered.map((p, i) => ({
        playerId: p.id,
        name: p.display_name,
        score: p.score,
        rank: i + 1,
      }));
      const now = new Date();
      const session: PastSession = {
        id: crypto.randomUUID(),
        gameName: liveGame.name,
        date: now.toLocaleDateString(undefined, { day: "numeric", month: "short" }),
        rounds: round,
        results,
      };
      const { data, error } = await supabase
        .from("game_results")
        .insert({ game_name: liveGame.name, rounds: round, results })
        .select()
        .single();
      if (error) console.debug("Failed to save game result:", error);
      if (data) session.id = data.id;
      setSessions((list) => [session, ...list]);
    }
    playVictory();
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 2800);
    setLiveGame(null);
  }
  const nav = [
    { id: "play", icon: Gamepad2, label: "Play" },
    { id: "players", icon: Users, label: "Players" },
    { id: "ranks", icon: Trophy, label: "Ranks" },
    { id: "stats", icon: BarChart3, label: "Stats" },
    { id: "history", icon: History, label: "History" },
  ] as const;
  if (liveGame)
    return (
      <LiveSession
        game={liveGame}
        players={livePlayers}
        allSquadPlayers={players}
        round={round}
        setRound={setRound}
        adjust={adjust}
        setScore={setScore}
        end={endGame}
        close={() => setLiveGame(null)}
        onAddBenchPlayer={addBenchPlayerToLive}
      />
    );
  const openProfile = players.find((p) => p.id === profileId);
  return (
    <div className="min-h-screen bg-background pb-24 text-foreground">
      {celebrate && <Confetti />}
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 md:px-7">
          <button
            type="button"
            onClick={() => setTab("play")}
            className="flex items-center gap-2.5 text-left transition hover:opacity-90"
          >
            <span className="grid size-10 place-items-center rounded-xl bg-primary text-xl font-bold text-primary-foreground shadow-md">
              🎲
            </span>
            <div>
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-primary">
                Game Night
              </p>
              <h1 className="font-heading text-2xl font-bold leading-tight">ScoreUp</h1>
            </div>
          </button>

          {/* Desktop Navigation matching mockup */}
          <div className="hidden items-center gap-1 rounded-2xl border border-border/80 bg-secondary/40 p-1 md:flex">
            {nav.map((item) => (
              <button
                key={item.id}
                onClick={() => setTab(item.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-bold transition ${
                  tab === item.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <item.icon className="size-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setTab("players")}
            aria-label="Friends and Players"
            className={`grid size-11 place-items-center rounded-full transition ${
              tab === "players"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-secondary text-foreground hover:bg-secondary/80"
            }`}
          >
            <Users className="size-5" />
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-7">
        {tab === "play" && (
          <PlayView
            games={games}
            players={players}
            start={handleSelectGame}
            openNew={() => setNewGame(true)}
            openPlayer={setProfileId}
            openAddPlayer={() => setAddPlayer(true)}
            goToPlayers={() => setTab("players")}
          />
        )}
        {tab === "players" && (
          <PlayersView
            players={players}
            sessions={sessions}
            openPlayer={setProfileId}
            openEditPlayer={(p) => setEditingPlayer(p)}
            openAddPlayer={() => setAddPlayer(true)}
          />
        )}
        {tab === "ranks" && (
          <RanksView players={players} sessions={sessions} openPlayer={setProfileId} />
        )}
        {tab === "stats" && <StatsView players={players} sessions={sessions} />}
        {tab === "history" && <HistoryView sessions={sessions} />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-xl justify-around px-3 py-2">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex min-w-14 flex-col items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-bold transition ${
                tab === item.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className="size-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      </nav>
      {setupGame && (
        <GameSetupModal
          game={setupGame}
          players={players}
          close={() => setSetupGame(null)}
          start={startSessionWithPlayers}
          openAddPlayer={() => setAddPlayer(true)}
        />
      )}
      {newGame && (
        <NewGameModal
          close={() => setNewGame(false)}
          save={async (name: string, type: string) => {
            const { data, error } = await supabase
              .from("custom_games")
              .insert({ name, scoring_type: type, high_score_wins: true, accent: "lime" })
              .select()
              .single();
            if (error) console.debug("Failed to save game:", error);
            setGames([
              ...games,
              {
                id: data?.id ?? crypto.randomUUID(),
                name,
                scoring_type: type,
                high_score_wins: true,
                accent: "lime",
              },
            ]);
            setNewGame(false);
          }}
        />
      )}
      {addPlayer && (
        <AddPlayerModal
          close={() => {
            setAddPlayer(false);
            setPendingGame(null);
          }}
          save={handleAddPlayer}
        />
      )}
      {editingPlayer && (
        <EditPlayerModal
          player={editingPlayer}
          close={() => setEditingPlayer(null)}
          save={handleUpdatePlayer}
          remove={handleDeletePlayer}
        />
      )}
      {openProfile && (
        <ProfileSheet
          player={openProfile}
          sessions={sessions}
          close={() => setProfileId(null)}
          onEdit={(p) => setEditingPlayer(p)}
        />
      )}
    </div>
  );
}

function ProfileSheet({
  player,
  sessions,
  close,
  onEdit,
}: {
  player: Player;
  sessions: PastSession[];
  close: () => void;
  onEdit?: (player: Player) => void;
}) {
  const mine = sessions.filter((s) => s.results.some((r) => r.playerId === player.id));
  const rows = mine.map((s) => {
    const r = s.results.find((x) => x.playerId === player.id)!;
    return { ...s, score: r.score, rank: r.rank };
  });
  const wins = rows.filter((r) => r.rank === 1).length;
  const total = rows.reduce((sum, r) => sum + r.score, 0);
  const rate = rows.length ? Math.round((wins / rows.length) * 100) : 0;
  const favourite =
    Object.entries(
      rows.reduce<Record<string, number>>(
        (acc, r) => ({ ...acc, [r.gameName]: (acc[r.gameName] ?? 0) + 1 }),
        {},
      ),
    ).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
  let streak = 0;
  for (const r of rows) {
    if (r.rank === 1) streak++;
    else break;
  }
  const trend = [...rows].reverse().map((r, i) => ({ n: `G${i + 1}`, score: r.score }));
  const animalInfo = spiritAnimals[player.spirit_animal] ?? {
    emoji: animals[player.spirit_animal] ?? "🦊",
    title: player.spirit_animal,
    defaultQuote: "Game night ready",
    badgeBg: "from-primary/20 to-secondary border-border",
  };
  const quote = player.quote || animalInfo.defaultQuote;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-background/85 p-4 backdrop-blur-sm sm:place-items-center">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[1.5rem] border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="animal-bob inline-block text-5xl">{animalInfo.emoji}</span>
            <div>
              <h2 className="font-heading text-3xl font-bold">{player.display_name}</h2>
              <p className="text-sm font-semibold text-primary">
                {animalInfo.emoji} {animalInfo.title}
              </p>
              <p className="mt-0.5 text-xs italic text-muted-foreground">"{quote}"</p>
              <p className="mt-1 text-xs text-muted-foreground">{rows.length} games played</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {onEdit && (
              <Button
                onClick={() => {
                  close();
                  onEdit(player);
                }}
                variant="ghost"
                size="icon"
                aria-label="Edit profile"
              >
                <Pencil className="size-4" />
              </Button>
            )}
            <Button onClick={close} variant="ghost" size="icon" aria-label="Close profile">
              <X />
            </Button>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3">
          {[
            { l: "Wins", v: wins },
            { l: "Win rate", v: `${rate}%` },
            { l: "Win streak", v: streak },
            { l: "Total points", v: total },
          ].map((s) => (
            <div key={s.l} className="rounded-2xl bg-secondary p-4">
              <p className="text-xs font-bold text-muted-foreground">{s.l.toUpperCase()}</p>
              <p className="mt-1 font-heading text-2xl font-bold text-primary">{s.v}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-sm text-muted-foreground">
          Favourite game · <span className="font-bold text-foreground">{favourite}</span>
        </p>
        {trend.length > 1 && (
          <div className="mt-5">
            <h3 className="mb-2 font-heading text-lg font-bold">Score trend</h3>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={trend}>
                <CartesianGrid stroke="var(--border)" />
                <XAxis dataKey="n" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip />
                <Line dataKey="score" stroke="var(--primary)" strokeWidth={3} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
        <h3 className="mt-5 font-heading text-lg font-bold">Recent scores</h3>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No games yet — finish a game to build stats.
          </p>
        ) : (
          <div className="mt-3 space-y-2">
            {rows.slice(0, 8).map((r) => (
              <div key={r.id} className="flex items-center gap-3 rounded-xl bg-secondary p-3">
                <span
                  className={`grid size-8 place-items-center rounded-lg font-black ${r.rank === 1 ? "bg-primary text-primary-foreground" : "bg-card"}`}
                >
                  {r.rank}
                </span>
                <div className="flex-1">
                  <p className="font-bold">{r.gameName}</p>
                  <p className="text-xs text-muted-foreground">
                    {r.date} · {r.rounds} rounds
                  </p>
                </div>
                <p className="font-heading text-lg font-bold tabular-nums">{r.score}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EditPlayerModal({
  player,
  close,
  save,
  remove,
}: {
  player: Player;
  close: () => void;
  save: (updated: Player) => void;
  remove: (id: string) => void;
}) {
  const [name, setName] = useState(player.display_name);
  const [animal, setAnimal] = useState(player.spirit_animal);
  const [quote, setQuote] = useState(
    player.quote || spiritAnimals[player.spirit_animal]?.defaultQuote || "",
  );
  const [confirmDelete, setConfirmDelete] = useState(false);

  function handleSelectAnimal(key: string) {
    setAnimal(key);
    const prevDefault = spiritAnimals[animal]?.defaultQuote;
    if (!quote || quote === prevDefault) {
      setQuote(spiritAnimals[key]?.defaultQuote || "");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-background/85 p-4 backdrop-blur-sm sm:place-items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[1.5rem] border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{spiritAnimals[animal]?.emoji ?? "🦊"}</span>
            <h2 className="font-heading text-2xl font-bold">Edit Friend Profile</h2>
          </div>
          <Button onClick={close} variant="ghost" size="icon" aria-label="Close">
            <X />
          </Button>
        </div>

        <label htmlFor="edit-player-name" className="mt-5 block text-sm font-bold">
          Friend Name
        </label>
        <input
          id="edit-player-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-border bg-secondary px-4 outline-none focus:border-primary"
          placeholder="e.g. Jordan"
        />

        <p className="mt-4 text-sm font-bold">Spirit Animal</p>
        <div className="mt-2 grid max-h-48 grid-cols-3 gap-2 overflow-y-auto pr-1">
          {Object.entries(spiritAnimals).map(([key, info]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectAnimal(key)}
              className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-center transition ${
                animal === key
                  ? "bg-primary font-bold text-primary-foreground shadow-md"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              }`}
            >
              <span className="text-2xl">{info.emoji}</span>
              <span className="line-clamp-1 text-[11px] leading-tight">{info.title}</span>
            </button>
          ))}
        </div>

        <label htmlFor="edit-player-quote" className="mt-4 block text-sm font-bold">
          Catchphrase / Quote
        </label>
        <input
          id="edit-player-quote"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-border bg-secondary px-4 italic outline-none focus:border-primary"
          placeholder='e.g. "Bold & fearless"'
        />

        <Button
          disabled={!name.trim()}
          onClick={() => {
            save({
              ...player,
              display_name: name.trim(),
              spirit_animal: animal,
              quote: quote.trim() || spiritAnimals[animal]?.defaultQuote || "Game night ready",
            });
          }}
          className="mt-6 h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground"
        >
          Save Changes
        </Button>

        <div className="mt-4 border-t border-border pt-4">
          {!confirmDelete ? (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex w-full items-center justify-center gap-2 py-1 text-xs font-semibold text-destructive/80 transition hover:text-destructive"
            >
              <Trash2 className="size-3.5" /> Remove {player.display_name} from squad
            </button>
          ) : (
            <div className="flex items-center justify-between rounded-xl border border-destructive/20 bg-destructive/10 p-3">
              <span className="text-xs font-semibold text-destructive">Are you sure?</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDelete(false)}
                  className="rounded-lg px-2.5 py-1 text-xs font-bold text-muted-foreground hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => remove(player.id)}
                  className="rounded-lg bg-destructive px-3 py-1 text-xs font-bold text-destructive-foreground hover:bg-destructive/90"
                >
                  Yes, Remove
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function AddPlayerModal({
  close,
  save,
}: {
  close: () => void;
  save: (name: string, animal: string, quote?: string) => void;
}) {
  const [name, setName] = useState("");
  const [animal, setAnimal] = useState("lion");
  const [quote, setQuote] = useState(spiritAnimals["lion"]?.defaultQuote ?? "Bold & fearless");

  function handleSelectAnimal(key: string) {
    setAnimal(key);
    const prevDefault = spiritAnimals[animal]?.defaultQuote;
    if (!quote || quote === prevDefault) {
      setQuote(spiritAnimals[key]?.defaultQuote || "");
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-background/85 p-4 backdrop-blur-sm sm:place-items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[1.5rem] border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{spiritAnimals[animal]?.emoji ?? "🦁"}</span>
            <h2 className="font-heading text-2xl font-bold">Add Friend Profile</h2>
          </div>
          <Button onClick={close} variant="ghost" size="icon" aria-label="Close">
            <X />
          </Button>
        </div>

        <label htmlFor="player-name" className="mt-5 block text-sm font-bold">
          Friend Name
        </label>
        <input
          id="player-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-border bg-secondary px-4 outline-none focus:border-primary"
          placeholder="e.g. Jordan, Alex, Sam…"
          autoFocus
        />

        <p className="mt-4 text-sm font-bold">Spirit Animal</p>
        <div className="mt-2 grid max-h-48 grid-cols-3 gap-2 overflow-y-auto pr-1">
          {Object.entries(spiritAnimals).map(([key, info]) => (
            <button
              key={key}
              type="button"
              onClick={() => handleSelectAnimal(key)}
              className={`flex flex-col items-center gap-1 rounded-xl p-2.5 text-center transition ${
                animal === key
                  ? "bg-primary font-bold text-primary-foreground shadow-md"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80 hover:text-foreground"
              }`}
            >
              <span className="text-2xl">{info.emoji}</span>
              <span className="line-clamp-1 text-[11px] leading-tight">{info.title}</span>
            </button>
          ))}
        </div>

        <label htmlFor="player-quote" className="mt-4 block text-sm font-bold">
          Catchphrase / Quote
        </label>
        <input
          id="player-quote"
          value={quote}
          onChange={(e) => setQuote(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-border bg-secondary px-4 italic outline-none focus:border-primary"
          placeholder='e.g. "Bold & fearless"'
        />

        <Button
          disabled={!name.trim()}
          onClick={() => save(name.trim(), animal, quote.trim())}
          className="mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 font-bold text-white shadow-lg shadow-purple-500/20 hover:brightness-110"
        >
          Add Friend to Squad
        </Button>
      </div>
    </div>
  );
}

function PlayersView({
  players,
  sessions,
  openPlayer,
  openEditPlayer,
  openAddPlayer,
}: {
  players: Player[];
  sessions: PastSession[];
  openPlayer: (id: string) => void;
  openEditPlayer: (player: Player) => void;
  openAddPlayer: () => void;
}) {
  const statsMap = new Map<string, PlayerStat>();
  playerStats(players, sessions).forEach((s) => statsMap.set(s.id, s));

  return (
    <section className="space-y-6">
      {/* Title Header matching mockup */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3.5">
          <div className="grid size-12 place-items-center rounded-2xl border border-primary/30 bg-primary/20 text-primary shadow-sm">
            <Users className="size-6" />
          </div>
          <div>
            <h2 className="font-heading text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Profiles
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              Persistent profiles accumulate career stats, trophies, and win rates across all game
              nights
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={openAddPlayer}
          className="inline-flex self-start items-center justify-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110 hover:shadow-purple-500/30 active:scale-95 sm:self-auto"
        >
          <UserPlus className="size-4" />
          <span>Add Friend</span>
        </button>
      </div>

      {players.length === 0 ? (
        <div className="mt-6 flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-card/60 p-12 text-center">
          <div className="grid size-16 place-items-center rounded-2xl border border-primary/30 bg-primary/10 text-3xl">
            👥
          </div>
          <h3 className="mt-4 font-heading text-2xl font-bold">No friend profiles yet</h3>
          <p className="mt-1.5 max-w-md text-sm text-muted-foreground">
            Create profiles with spirit animals, nicknames, and catchphrases. Career stats, win
            rates, and trophies will accumulate as you play games.
          </p>
          <button
            type="button"
            onClick={openAddPlayer}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 px-6 py-3 font-bold text-white shadow-lg shadow-purple-500/20 hover:brightness-110"
          >
            <UserPlus className="size-4" />
            <span>Add Your First Friend</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {players.map((p) => {
            const stat = statsMap.get(p.id) ?? {
              id: p.id,
              name: p.display_name,
              animal: p.spirit_animal,
              games: 0,
              wins: 0,
              rate: 0,
              points: 0,
              streak: 0,
              favourite: "—",
              scores: [],
            };
            const animalInfo = spiritAnimals[p.spirit_animal] ?? {
              emoji: animals[p.spirit_animal] ?? "🦊",
              title: p.spirit_animal,
              defaultQuote: "Game night ready",
              badgeBg: "from-primary/20 to-secondary border-border",
            };
            const quote = p.quote || animalInfo.defaultQuote;

            return (
              <div
                key={p.id}
                onClick={() => openPlayer(p.id)}
                className="group relative flex cursor-pointer flex-col justify-between rounded-[1.25rem] border border-border/80 bg-card p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-primary/60 hover:shadow-lg"
              >
                <div>
                  {/* Card Header: Avatar, Name & Spirit Animal, Edit Pencil */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3.5">
                      <div
                        className={`grid size-14 place-items-center rounded-2xl border bg-gradient-to-br ${animalInfo.badgeBg} shadow-inner`}
                      >
                        <span className="text-3xl filter drop-shadow-sm">{animalInfo.emoji}</span>
                      </div>
                      <div>
                        <h3 className="font-heading text-xl font-bold text-foreground transition-colors group-hover:text-primary">
                          {p.display_name}
                        </h3>
                        <p className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                          <span>{animalInfo.emoji}</span>
                          <span>{animalInfo.title}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      aria-label={`Edit ${p.display_name}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditPlayer(p);
                      }}
                      className="grid size-8 place-items-center rounded-lg text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                    >
                      <Pencil className="size-4" />
                    </button>
                  </div>

                  {/* Catchphrase quote pill */}
                  <div className="mt-3.5 rounded-xl border border-border/40 bg-secondary/50 px-3.5 py-2 text-center text-xs italic font-medium text-muted-foreground">
                    "{quote}"
                  </div>

                  {/* 3 Stats Columns */}
                  <div className="mt-4 grid grid-cols-3 border-y border-border/50 py-3 text-center">
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        PLAYED
                      </p>
                      <p className="mt-1 font-heading text-xl font-bold text-foreground">
                        {stat.games}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        VICTORIES
                      </p>
                      <p className="mt-1 font-heading text-xl font-bold text-amber-400">
                        {stat.wins}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                        WIN RATE
                      </p>
                      <p className="mt-1 font-heading text-xl font-bold text-emerald-400">
                        {stat.rate}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer: All-Time Score */}
                <div className="mt-3.5 flex items-center justify-between pt-1 text-xs">
                  <span className="font-medium text-muted-foreground">All-Time Score</span>
                  <span className="font-heading text-sm font-bold text-indigo-300">
                    {stat.points} pts
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PlayView({
  games,
  players,
  start,
  openNew,
  openPlayer,
  openAddPlayer,
  goToPlayers,
}: {
  games: Game[];
  players: Player[];
  start: (g: Game) => void;
  openNew: () => void;
  openPlayer: (id: string) => void;
  openAddPlayer: () => void;
  goToPlayers?: () => void;
}) {
  return (
    <>
      <section>
        <h2 className="font-heading text-3xl font-bold">Start a game</h2>
        <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
          {games.map((game, i) => (
            <button
              key={game.id}
              onClick={() => start(game)}
              className="group min-h-44 rounded-[1.5rem] border border-border bg-card p-5 text-left transition hover:-translate-y-1 hover:border-primary"
            >
              <span
                className={`grid size-14 place-items-center rounded-2xl text-background ${i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-sun" : "bg-mint"}`}
              >
                <Gamepad2 />
              </span>
              <h3 className="mt-5 font-heading text-2xl font-bold">{game.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {game.scoring_type.replace("_", " · ")} · {game.high_score_wins ? "High" : "Low"}{" "}
                wins
              </p>
            </button>
          ))}
          <button
            onClick={openNew}
            className="min-h-44 rounded-[1.5rem] border border-dashed border-muted-foreground bg-card p-5 text-left"
          >
            <span className="grid size-14 place-items-center rounded-2xl bg-secondary text-primary">
              <Plus />
            </span>
            <h3 className="mt-5 font-heading text-2xl font-bold">New game</h3>
            <p className="mt-1 text-sm text-muted-foreground">Add your own rules</p>
          </button>
        </div>
      </section>
      <section className="mt-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-3xl font-bold">The squad</h2>
            <p className="text-sm text-muted-foreground">
              {players.length === 0
                ? "No players yet — add friends when you're ready to play"
                : `${players.length} friend${players.length === 1 ? "" : "s"} ready for game night`}
            </p>
          </div>
          <Button
            onClick={openAddPlayer}
            variant="outline"
            className="rounded-xl border-primary/40 font-bold text-primary hover:bg-primary/10"
          >
            <Plus className="mr-1.5 size-4" /> Add player
          </Button>
        </div>

        {players.length === 0 ? (
          <div className="mt-5 flex flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-border bg-card/60 p-8 text-center">
            <span className="text-4xl">👋</span>
            <h3 className="mt-3 font-heading text-xl font-bold">No players in the squad</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              Add your friends' names and spirit animals when you are ready to play.
            </p>
            <Button
              onClick={openAddPlayer}
              className="mt-5 h-12 rounded-xl bg-primary px-6 font-bold text-primary-foreground shadow-md hover:brightness-105"
            >
              <Plus className="mr-1.5 size-4" /> Add your first player
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-2.5">
            {players.map((p) => {
              const animalInfo = spiritAnimals[p.spirit_animal] ?? {
                emoji: animals[p.spirit_animal] ?? "🦊",
                title: p.spirit_animal,
                defaultQuote: "Game night ready",
              };
              const quote = p.quote || animalInfo.defaultQuote;
              return (
                <button
                  key={p.id}
                  onClick={() => openPlayer(p.id)}
                  className="flex w-full items-center justify-between rounded-2xl border border-border bg-card p-3.5 text-left transition hover:-translate-y-0.5 hover:border-primary hover:bg-secondary/40"
                >
                  <div className="flex items-center gap-3.5">
                    <span className="animal-bob inline-block text-3xl">{animalInfo.emoji}</span>
                    <div>
                      <p className="font-heading text-lg font-bold text-foreground">
                        {p.display_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {animalInfo.title} · <span className="italic">"{quote}"</span>
                      </p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-primary">View profile →</span>
                </button>
              );
            })}

            <div className="flex flex-col gap-2 pt-1 sm:flex-row">
              <button
                onClick={openAddPlayer}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-dashed border-muted-foreground/30 bg-card/40 p-3.5 text-center font-bold text-primary transition hover:border-primary hover:bg-secondary/60"
              >
                <Plus className="size-4" /> Add another player
              </button>
              {goToPlayers && (
                <button
                  onClick={goToPlayers}
                  className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-secondary/60 px-5 py-3.5 text-center text-xs font-bold text-foreground transition hover:border-primary hover:bg-secondary"
                >
                  <Users className="size-4 text-primary" /> View all friend profiles
                </button>
              )}
            </div>
          </div>
        )}
      </section>
    </>
  );
}

function GameSetupModal({
  game,
  players,
  close,
  start,
  openAddPlayer,
}: {
  game: Game;
  players: Player[];
  close: () => void;
  start: (game: Game, selected: Player[]) => void;
  openAddPlayer: () => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const initialCount = players.length >= 10 ? 5 : players.length;
    return new Set(players.slice(0, initialCount).map((p) => p.id));
  });

  // Auto-select newly added players if squad grows
  const [knownIds, setKnownIds] = useState<Set<string>>(() => new Set(players.map((p) => p.id)));
  useEffect(() => {
    const newPlayers = players.filter((p) => !knownIds.has(p.id));
    if (newPlayers.length > 0) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        newPlayers.forEach((p) => next.add(p.id));
        return next;
      });
      setKnownIds(new Set(players.map((p) => p.id)));
    }
  }, [players, knownIds]);

  function togglePlayer(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(players.map((p) => p.id)));
  }

  function clearAll() {
    setSelectedIds(new Set());
  }

  function selectFirst(count: number) {
    setSelectedIds(new Set(players.slice(0, count).map((p) => p.id)));
  }

  const selectedList = players.filter((p) => selectedIds.has(p.id));
  const isAllSelected = selectedIds.size === players.length && players.length > 0;

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-background/85 p-4 backdrop-blur-sm sm:place-items-center">
      <div className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-[1.5rem] border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={`grid size-12 place-items-center rounded-2xl text-background font-bold ${
                game.accent === "lime"
                  ? "bg-primary"
                  : game.accent === "yellow"
                    ? "bg-sun"
                    : "bg-mint"
              }`}
            >
              <Gamepad2 className="size-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading text-2xl font-bold">{game.name}</h2>
                <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
                  {game.high_score_wins ? "High wins" : "Lowest score wins"}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                Choose participating players ({selectedIds.size} of {players.length} selected)
              </p>
            </div>
          </div>
          <Button onClick={close} variant="ghost" size="icon" aria-label="Close setup">
            <X />
          </Button>
        </div>

        <div className="mt-5 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Squad roster
            </span>
            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-bold text-primary">
              {selectedIds.size} selected
            </span>
          </div>
          <div className="flex items-center gap-2">
            {players.length > 5 && (
              <button
                type="button"
                onClick={() => selectFirst(5)}
                className="rounded-lg bg-secondary px-2.5 py-1 text-xs font-bold text-foreground hover:bg-primary/20 hover:text-primary transition"
              >
                Pick 5
              </button>
            )}
            <button
              type="button"
              onClick={selectAll}
              disabled={isAllSelected}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-primary hover:bg-primary/10 transition disabled:opacity-40"
            >
              All
            </button>
            <span className="text-muted-foreground/30">|</span>
            <button
              type="button"
              onClick={clearAll}
              disabled={selectedIds.size === 0}
              className="rounded-lg px-2.5 py-1 text-xs font-bold text-muted-foreground hover:text-foreground transition disabled:opacity-40"
            >
              Clear
            </button>
          </div>
        </div>

        <div className="mt-3 flex-1 overflow-y-auto space-y-2 pr-1 max-h-[46vh]">
          {players.map((p) => {
            const isSelected = selectedIds.has(p.id);
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => togglePlayer(p.id)}
                className={`flex w-full items-center justify-between rounded-2xl border p-3.5 text-left transition ${
                  isSelected
                    ? "border-primary bg-primary/10 text-foreground shadow-sm"
                    : "border-border bg-secondary/30 text-muted-foreground hover:border-border hover:bg-secondary/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="animal-bob inline-block text-3xl">
                    {animals[p.spirit_animal] ?? "🦊"}
                  </span>
                  <div>
                    <p
                      className={`font-heading text-base font-bold ${
                        isSelected ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {p.display_name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {isSelected ? "Participating in game" : "Sitting out"}
                    </p>
                  </div>
                </div>
                <span
                  className={`grid size-7 place-items-center rounded-xl font-bold transition ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow"
                      : "border border-border bg-card text-transparent"
                  }`}
                >
                  <Check className="size-4 stroke-[3]" />
                </span>
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={openAddPlayer}
          className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/40 py-2.5 text-xs font-bold text-primary hover:bg-secondary transition"
        >
          <Plus className="size-4" /> Add another player to squad
        </button>

        <div className="mt-5 border-t border-border pt-4">
          <Button
            disabled={selectedIds.size === 0}
            onClick={() => start(game, selectedList)}
            className="h-14 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground shadow-lg hover:brightness-105 disabled:opacity-50"
          >
            <Play className="mr-2 size-5 fill-current" />
            {selectedIds.size === 0
              ? "Select at least 1 player to begin"
              : `Start ${game.name} (${selectedIds.size} ${
                  selectedIds.size === 1 ? "player" : "players"
                })`}
          </Button>
        </div>
      </div>
    </div>
  );
}

function LiveSession({
  game,
  players,
  allSquadPlayers,
  round,
  setRound,
  adjust,
  setScore,
  end,
  close,
  onAddBenchPlayer,
}: {
  game: Game;
  players: LivePlayer[];
  allSquadPlayers?: Player[];
  round: number;
  setRound: React.Dispatch<React.SetStateAction<number>> | ((fn: (r: number) => number) => void);
  adjust: (id: string, by: number) => void;
  setScore: (id: string, score: number) => void;
  end: () => void;
  close: () => void;
  onAddBenchPlayer?: (p: Player) => void;
}) {
  const sorted = [...players].sort((a, b) =>
    game.high_score_wins ? b.score - a.score : a.score - b.score,
  );
  const rankById = new Map(
    sorted.map((player: LivePlayer, index: number) => [player.id, index + 1]),
  );
  const benchPlayers = (allSquadPlayers ?? []).filter(
    (sp: Player) => !players.some((lp: LivePlayer) => lp.id === sp.id),
  );
  return (
    <main className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <Button onClick={close} variant="ghost" size="icon" aria-label="Close">
            <X />
          </Button>
          <div className="text-center">
            <p className="text-xs font-bold text-primary">
              LIVE · ROUND {round} · {players.length} PLAYERS
            </p>
            <h1 className="font-heading text-xl font-bold">{game.name}</h1>
          </div>
          <Button onClick={end} className="rounded-xl bg-primary text-primary-foreground">
            Finish
          </Button>
        </div>
      </header>
      <div className="mx-auto max-w-2xl px-4 py-5">
        <div className="mb-5 flex items-center justify-between rounded-2xl bg-primary p-4 text-primary-foreground">
          <div>
            <p className="text-xs font-bold">CURRENT LEADER</p>
            <p className="font-heading text-2xl font-bold">{sorted[0]?.display_name}</p>
          </div>
          <div className="text-right">
            <span className="animal-bob inline-block text-3xl">
              {animals[sorted[0]?.spirit_animal ?? ""]}
            </span>
            <p className="text-3xl font-black tabular-nums">{sorted[0]?.score}</p>
          </div>
        </div>
        <div className="mb-3 flex items-center justify-between px-1">
          <h2 className="font-heading text-xl font-bold">Current ranking</h2>
          <p className="text-xs font-bold text-muted-foreground">TYPE OR TAP TO SCORE</p>
        </div>
        <div className="space-y-3">
          {players.map((p: LivePlayer) => {
            const rank = rankById.get(p.id);
            return (
              <div
                key={p.id}
                className="grid grid-cols-[2.5rem_2.75rem_minmax(0,1fr)] items-center gap-2 rounded-2xl border border-border bg-card p-3 sm:grid-cols-[2.5rem_3rem_minmax(0,1fr)_3rem_5rem_3rem]"
              >
                <span
                  aria-label={`Rank ${rank}`}
                  className={`grid size-10 place-items-center rounded-xl font-black ${rank === 1 ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}
                >
                  {rank}
                </span>
                <span className="grid size-11 place-items-center rounded-xl bg-secondary text-2xl">
                  {animals[p.spirit_animal]}
                </span>
                <p className="min-w-0 truncate font-heading text-lg font-bold">{p.display_name}</p>
                <div className="col-span-3 grid grid-cols-[3rem_1fr_3rem] gap-2 sm:col-span-1 sm:contents">
                  <Button
                    aria-label={`Subtract from ${p.display_name}`}
                    onClick={() => adjust(p.id, -1)}
                    variant="secondary"
                    size="icon"
                    className="size-12 rounded-xl"
                  >
                    <Minus />
                  </Button>
                  <input
                    aria-label={`${p.display_name} score`}
                    type="number"
                    inputMode="numeric"
                    value={p.score}
                    onChange={(event) => setScore(p.id, Number(event.target.value) || 0)}
                    className="h-12 min-w-0 rounded-xl border border-border bg-secondary px-2 text-center text-2xl font-black tabular-nums outline-none focus:border-primary focus:ring-2 focus:ring-primary/30"
                  />
                  <Button
                    aria-label={`Add to ${p.display_name}`}
                    onClick={() => adjust(p.id, 1)}
                    size="icon"
                    className="size-12 rounded-xl bg-primary text-primary-foreground"
                  >
                    <Plus />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
        {benchPlayers.length > 0 && onAddBenchPlayer && (
          <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/50 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Bench ({benchPlayers.length} sitting out)
            </p>
            <p className="mt-1 text-xs text-muted-foreground">Tap any friend to deal them in:</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {benchPlayers.map((bp: Player) => (
                <button
                  key={bp.id}
                  onClick={() => onAddBenchPlayer(bp)}
                  className="flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold text-foreground hover:bg-primary/20 hover:text-primary transition"
                >
                  <span>{animals[bp.spirit_animal] ?? "🦊"}</span>
                  <span>+ Add {bp.display_name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface p-4">
        <Button
          onClick={() => setRound((r: number) => r + 1)}
          className="mx-auto flex h-14 w-full max-w-2xl rounded-xl bg-primary text-base font-bold text-primary-foreground"
        >
          <CirclePlus /> Save round {round}
        </Button>
      </div>
    </main>
  );
}

function EmptyStats({ label }: { label: string }) {
  return (
    <div className="mt-6 rounded-[1.5rem] border border-dashed border-muted-foreground bg-card p-8 text-center">
      <p className="text-4xl">🎲</p>
      <p className="mt-3 font-heading text-xl font-bold">No games finished yet</p>
      <p className="mt-1 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
function RanksView({
  players,
  sessions,
  openPlayer,
}: {
  players: Player[];
  sessions: PastSession[];
  openPlayer: (id: string) => void;
}) {
  const stats = playerStats(players, sessions);
  return (
    <section>
      <p className="font-bold text-primary">ALL GAMES · ALL TIME</p>
      <h2 className="mt-1 font-heading text-4xl font-bold">Leaderboard</h2>
      {sessions.length === 0 ? (
        <EmptyStats label="Finish a game and the leaderboard fills up." />
      ) : (
        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-border bg-card">
          {stats.map((s, i) => (
            <button
              key={s.id}
              onClick={() => openPlayer(s.id)}
              className="flex w-full items-center gap-4 border-b border-border p-4 text-left last:border-0 hover:bg-secondary"
            >
              <span
                className={`grid size-10 place-items-center rounded-xl font-black ${i === 0 ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
              >
                {i + 1}
              </span>
              <span className="text-3xl">{animals[s.animal] ?? "🦊"}</span>
              <div className="flex-1">
                <p className="font-heading text-lg font-bold">{s.name}</p>
                <p className="text-sm text-muted-foreground">
                  {s.wins} wins · {s.points} pts · {s.rate}%
                </p>
              </div>
              <Trophy className={i === 0 ? "text-primary" : "text-muted-foreground"} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
function StatsView({ players, sessions }: { players: Player[]; sessions: PastSession[] }) {
  const stats = playerStats(players, sessions);
  const [metric, setMetric] = useState<"rate" | "wins">("rate");
  const [layout, setLayout] = useState<"columns" | "rows">("columns");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc" | "alpha">("desc");

  const totalVictories = sessions.length;
  const squadSize = players.length;
  const mvp = stats.reduce<PlayerStat | null>((best, s) => {
    if (!s.games) return best;
    if (!best) return s;
    return s.wins > best.wins || (s.wins === best.wins && s.rate > best.rate) ? s : best;
  }, null);

  if (sessions.length === 0) {
    return (
      <section>
        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2 text-2xl font-bold">
              <span>🏆</span>
              <h2 className="font-heading text-3xl font-bold md:text-4xl">Squad Stats</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Total game night victories recorded by each player across the squad
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 pt-2 md:pt-0">
            <div className="rounded-2xl border border-border/80 bg-card/80 px-4 py-2 text-right">
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Squad Size
              </p>
              <p className="font-heading text-lg font-bold text-foreground">{squadSize} Players</p>
            </div>
          </div>
        </div>
        <EmptyStats label="Charts appear once you finish your first game." />
      </section>
    );
  }

  const sortedData = [...stats]
    .sort((a, b) => {
      if (sortOrder === "desc") {
        return metric === "rate"
          ? b.rate - a.rate || b.wins - a.wins || a.name.localeCompare(b.name)
          : b.wins - a.wins || b.rate - a.rate || a.name.localeCompare(b.name);
      }
      if (sortOrder === "asc") {
        return metric === "rate"
          ? a.rate - b.rate || a.wins - b.wins || a.name.localeCompare(b.name)
          : a.wins - b.wins || a.rate - b.rate || a.name.localeCompare(b.name);
      }
      return a.name.localeCompare(b.name);
    })
    .map((s) => ({
      ...s,
      value: metric === "rate" ? s.rate : s.wins,
      displayLabel: metric === "rate" ? `${s.rate}%` : s.wins > 0 ? `${s.wins} 🏆` : "0",
    }));

  const BAR_COLORS = [
    "#EAB308",
    "#F97316",
    "#10B981",
    "#8B5CF6",
    "#3B82F6",
    "#EC4899",
    "#06B6D4",
    "#F43F5E",
    "#14B8A6",
    "#A855F7",
  ];

  return (
    <section className="space-y-6">
      {/* Top Header with Badges matching mockup */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="text-3xl">🏆</span>
            <h2 className="font-heading text-3xl font-bold tracking-tight md:text-4xl">
              Squad Stats
            </h2>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Total game night victories recorded by each player across the squad
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {mvp && mvp.wins > 0 && (
            <div className="flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-left shadow-sm">
              <span className="grid size-9 place-items-center rounded-xl bg-amber-500/20 text-xl">
                👑
              </span>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-amber-400">
                  Squad MVP
                </p>
                <p className="font-heading text-sm font-bold text-foreground">
                  {mvp.name}{" "}
                  <span className="font-normal text-muted-foreground">
                    ({mvp.wins} {mvp.wins === 1 ? "Win" : "Wins"})
                  </span>
                </p>
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-border/80 bg-card/90 px-4 py-2.5 text-left shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Total Squad Victories
            </p>
            <p className="font-heading text-base font-bold text-primary">
              {totalVictories} {totalVictories === 1 ? "Win" : "Wins"}
            </p>
          </div>

          <div className="rounded-2xl border border-border/80 bg-card/90 px-4 py-2.5 text-left shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Squad Size
            </p>
            <p className="font-heading text-base font-bold text-foreground">{squadSize} Players</p>
          </div>
        </div>
      </div>

      {/* Main Single Graph Card */}
      <div className="rounded-[1.75rem] border border-border bg-card p-5 md:p-7 shadow-xl">
        <div className="flex flex-col gap-4 border-b border-border/60 pb-5 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-amber-400">
              <BarChart3 className="size-3.5" />
              <span>{metric === "rate" ? "WIN RATE GRAPH CHART" : "VICTORIES GRAPH CHART"}</span>
            </div>
            <h3 className="mt-1 font-heading text-2xl font-bold text-foreground">
              {metric === "rate" ? "Win Rate by Each Player" : "Total Wins by Each Player"}
            </h3>
          </div>

          {/* Controls matching mockup */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center rounded-xl border border-border/60 bg-secondary/80 p-1">
              <button
                type="button"
                onClick={() => setMetric("rate")}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  metric === "rate"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Win Rate (%)
              </button>
              <button
                type="button"
                onClick={() => setMetric("wins")}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  metric === "wins"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Total Wins
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setSortOrder((prev) =>
                  prev === "desc" ? "asc" : prev === "asc" ? "alpha" : "desc",
                );
              }}
              className="flex items-center gap-1.5 rounded-xl border border-border/70 bg-secondary/60 px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary transition"
            >
              <ArrowUpDown className="size-3.5 text-primary" />
              <span>
                {sortOrder === "desc"
                  ? `Sorted by ${metric === "rate" ? "Win Rate" : "Wins"}`
                  : sortOrder === "asc"
                    ? "Lowest first"
                    : "Alphabetical"}
              </span>
            </button>

            <div className="flex items-center rounded-xl border border-border/60 bg-secondary/80 p-1">
              <button
                type="button"
                onClick={() => setLayout("columns")}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  layout === "columns"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Columns
              </button>
              <button
                type="button"
                onClick={() => setLayout("rows")}
                className={`rounded-lg px-3 py-1 text-xs font-bold transition ${
                  layout === "rows"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Rows
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 w-full">
          {layout === "columns" ? (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={sortedData} margin={{ top: 28, right: 16, left: -10, bottom: 20 }}>
                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  vertical={false}
                  opacity={0.6}
                />
                <XAxis
                  dataKey="name"
                  stroke="var(--muted-foreground)"
                  tick={{ fontSize: 13, fontWeight: 600 }}
                  tickLine={false}
                  dy={8}
                />
                <YAxis
                  stroke="var(--muted-foreground)"
                  tick={{ fontSize: 12 }}
                  tickLine={false}
                  domain={metric === "rate" ? [0, 100] : [0, "auto"]}
                  tickFormatter={metric === "rate" ? (v) => `${v}%` : undefined}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomStatsTooltip />} />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} minPointSize={4}>
                  <LabelList
                    dataKey="displayLabel"
                    position="top"
                    fill="currentColor"
                    className="text-xs font-black fill-foreground"
                    offset={8}
                  />
                  {sortedData.map((entry, index) => (
                    <Cell
                      key={entry.id}
                      fill={
                        entry.value === 0
                          ? "rgba(120, 120, 140, 0.25)"
                          : BAR_COLORS[index % BAR_COLORS.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(260, sortedData.length * 52)}>
              <BarChart
                data={sortedData}
                layout="vertical"
                margin={{ top: 10, right: 48, left: 24, bottom: 10 }}
              >
                <CartesianGrid
                  stroke="var(--border)"
                  strokeDasharray="3 3"
                  horizontal={false}
                  opacity={0.6}
                />
                <XAxis
                  type="number"
                  stroke="var(--muted-foreground)"
                  domain={metric === "rate" ? [0, 100] : [0, "auto"]}
                  tickFormatter={metric === "rate" ? (v) => `${v}%` : undefined}
                  allowDecimals={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="var(--muted-foreground)"
                  tick={{ fontSize: 13, fontWeight: 600 }}
                  tickLine={false}
                />
                <Tooltip content={<CustomStatsTooltip />} />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} minPointSize={4}>
                  <LabelList
                    dataKey="displayLabel"
                    position="right"
                    fill="currentColor"
                    className="text-xs font-black fill-foreground"
                    offset={8}
                  />
                  {sortedData.map((entry, index) => (
                    <Cell
                      key={entry.id}
                      fill={
                        entry.value === 0
                          ? "rgba(120, 120, 140, 0.25)"
                          : BAR_COLORS[index % BAR_COLORS.length]
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </section>
  );
}

function CustomStatsTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: PlayerStat & { value: number; displayLabel: string } }>;
}) {
  if (!active || !payload || !payload.length) return null;
  const data = payload[0].payload;
  return (
    <div className="rounded-2xl border border-border bg-card/95 p-3.5 shadow-xl backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <span className="text-2xl">{animals[data.animal] ?? "🦊"}</span>
        <div>
          <p className="font-heading text-base font-bold text-foreground">{data.name}</p>
          <p className="text-xs text-muted-foreground">
            {data.games} {data.games === 1 ? "game" : "games"} played
          </p>
        </div>
      </div>
      <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-border/60 pt-2 text-xs">
        <div>
          <span className="text-muted-foreground">Win rate: </span>
          <span className="font-bold text-primary">{data.rate}%</span>
        </div>
        <div>
          <span className="text-muted-foreground">Wins: </span>
          <span className="font-bold text-foreground">{data.wins}</span>
        </div>
        <div className="col-span-2">
          <span className="text-muted-foreground">Favourite: </span>
          <span className="font-bold text-foreground">{data.favourite}</span>
        </div>
      </div>
    </div>
  );
}
function HistoryView({ sessions }: { sessions: PastSession[] }) {
  const rows = sessions.map((s) => ({
    key: s.id,
    g: s.gameName,
    w: s.results[0]?.name ?? "—",
    d: `${s.date} · ${s.rounds} rounds`,
    s: `${s.results[0]?.score ?? 0} pts`,
  }));
  return (
    <section>
      <p className="font-bold text-primary">THE ARCHIVES</p>
      <h2 className="mt-1 font-heading text-4xl font-bold">Session history</h2>
      {rows.length === 0 ? (
        <EmptyStats label="Finished games land here with dates and final scores." />
      ) : (
        <div className="mt-6 space-y-3">
          {rows.map((x) => (
            <div
              key={x.key}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <span className="grid size-12 place-items-center rounded-xl bg-secondary text-2xl">
                🏆
              </span>
              <div className="flex-1">
                <p className="font-heading text-lg font-bold">
                  {x.g} · {x.w} won
                </p>
                <p className="text-sm text-muted-foreground">{x.d}</p>
              </div>
              <p className="font-bold text-primary">{x.s}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function NewGameModal({
  close,
  save,
}: {
  close: () => void;
  save: (name: string, type: string) => void;
}) {
  const [name, setName] = useState("");
  const [type, setType] = useState("points");
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-background/80 p-4 backdrop-blur-sm sm:place-items-center">
      <div className="w-full max-w-md rounded-[1.5rem] border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold">Add a game</h2>
          <Button onClick={close} variant="ghost" size="icon">
            <X />
          </Button>
        </div>
        <label className="mt-5 block text-sm font-bold">Game name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-border bg-secondary px-4 outline-none focus:border-primary"
          placeholder="Rummy, Catan, Darts…"
        />
        <label className="mt-5 block text-sm font-bold">Scoring type</label>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {["points", "win_loss", "ranked"].map((t) => (
            <button
              key={t}
              onClick={() => setType(t)}
              className={`rounded-xl px-2 py-3 text-sm font-bold ${type === t ? "bg-primary text-primary-foreground" : "bg-secondary"}`}
            >
              {t.replace("_", " / ")}
            </button>
          ))}
        </div>
        <Button
          disabled={!name.trim()}
          onClick={() => save(name, type)}
          className="mt-6 h-12 w-full rounded-xl bg-primary text-primary-foreground"
        >
          Add game
        </Button>
      </div>
    </div>
  );
}
function Confetti() {
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
      {Array.from({ length: 36 }, (_, i) => (
        <i
          key={i}
          className={`absolute top-0 size-2 ${i % 3 === 0 ? "bg-primary" : i % 3 === 1 ? "bg-sun" : "bg-mint"}`}
          style={{
            left: `${(i * 29) % 100}%`,
            animation: `confetti-fall ${1.7 + (i % 5) * 0.2}s ease-in ${(i % 9) * 0.08}s both`,
          }}
        />
      ))}
    </div>
  );
}
function playVictory() {
  try {
    const AudioContextCtor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioContextCtor();
    [523, 659, 784, 1047].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g);
      g.connect(ctx.destination);
      o.frequency.value = f;
      g.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.28);
      o.start(ctx.currentTime + i * 0.1);
      o.stop(ctx.currentTime + i * 0.1 + 0.3);
    });
  } catch {
    /* sound is optional */
  }
}
