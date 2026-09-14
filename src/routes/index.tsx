import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import {
  BarChart3,
  Check,
  CirclePlus,
  Gamepad2,
  History,
  Minus,
  Play,
  Plus,
  Trophy,
  Users,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";

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

type Tab = "play" | "ranks" | "stats" | "history";
type Game = {
  id: string;
  name: string;
  scoring_type: string;
  high_score_wins: boolean;
  accent: string;
};
type Player = { id: string; display_name: string; spirit_animal: string };
type LivePlayer = Player & { score: number };
type PastSession = {
  id: string;
  gameName: string;
  date: string;
  rounds: number;
  results: { playerId: string; name: string; score: number; rank: number }[];
};
const animals: Record<string, string> = {
  fox: "🦊",
  owl: "🦉",
  frog: "🐸",
  bear: "🐻",
  tiger: "🐯",
  panda: "🐼",
  octopus: "🐙",
  turtle: "🐢",
};
const demoPlayers: Player[] = [
  { id: "p1", display_name: "Alex", spirit_animal: "fox" },
  { id: "p2", display_name: "Sam", spirit_animal: "owl" },
  { id: "p3", display_name: "Jordan", spirit_animal: "frog" },
  { id: "p4", display_name: "Taylor", spirit_animal: "bear" },
  { id: "p5", display_name: "Morgan", spirit_animal: "tiger" },
  { id: "p6", display_name: "Casey", spirit_animal: "panda" },
  { id: "p7", display_name: "Riley", spirit_animal: "octopus" },
  { id: "p8", display_name: "Jamie", spirit_animal: "turtle" },
  { id: "p9", display_name: "Quinn", spirit_animal: "fox" },
  { id: "p10", display_name: "Avery", spirit_animal: "owl" },
];
const demoGames: Game[] = [
  { id: "sevens", name: "Sevens", scoring_type: "points", high_score_wins: false, accent: "lime" },
  { id: "poker", name: "Poker", scoring_type: "points", high_score_wins: true, accent: "yellow" },
  { id: "uno", name: "Uno", scoring_type: "points", high_score_wins: true, accent: "mint" },
];

function ScoreUp() {
  return <GameApp />;
}

function GameApp() {
  const [tab, setTab] = useState<Tab>("play");
  const [games, setGames] = useState<Game[]>(demoGames);
  const [players, setPlayers] = useState<Player[]>(demoPlayers);
  const [setupGame, setSetupGame] = useState<Game | null>(null);
  const [liveGame, setLiveGame] = useState<Game | null>(null);
  const [livePlayers, setLivePlayers] = useState<LivePlayer[]>([]);
  const [round, setRound] = useState(1);
  const [celebrate, setCelebrate] = useState(false);
  const [newGame, setNewGame] = useState(false);
  const [addPlayer, setAddPlayer] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [sessions, setSessions] = useState<PastSession[]>([]);

  // Hydrate from localStorage once on client
  useEffect(() => {
    try {
      const savedPlayers = localStorage.getItem("scoreup_players");
      if (savedPlayers) {
        const parsed = JSON.parse(savedPlayers);
        if (Array.isArray(parsed) && parsed.length > 0) setPlayers(parsed);
      }
      const savedGames = localStorage.getItem("scoreup_games");
      if (savedGames) {
        const parsed = JSON.parse(savedGames);
        if (Array.isArray(parsed) && parsed.length > 0) setGames(parsed);
      }
      const savedSessions = localStorage.getItem("scoreup_sessions");
      if (savedSessions) {
        const parsed = JSON.parse(savedSessions);
        if (Array.isArray(parsed)) setSessions(parsed);
      }
    } catch (e) {
      console.debug("Failed to load local storage state:", e);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("scoreup_players", JSON.stringify(players));
    } catch (e) {
      console.debug("Failed to save players to local storage:", e);
    }
  }, [players]);

  useEffect(() => {
    try {
      localStorage.setItem("scoreup_games", JSON.stringify(games));
    } catch (e) {
      console.debug("Failed to save games to local storage:", e);
    }
  }, [games]);

  useEffect(() => {
    try {
      localStorage.setItem("scoreup_sessions", JSON.stringify(sessions));
    } catch (e) {
      console.debug("Failed to save sessions to local storage:", e);
    }
  }, [sessions]);

  function handleSelectGame(game: Game) {
    if (players.length === 0) {
      setAddPlayer(true);
      return;
    }
    setSetupGame(game);
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
      setSessions((list) => [
        {
          id: crypto.randomUUID(),
          gameName: liveGame.name,
          date: new Date().toLocaleDateString(undefined, { day: "numeric", month: "short" }),
          rounds: round,
          results: ordered.map((p, i) => ({
            playerId: p.id,
            name: p.display_name,
            score: p.score,
            rank: i + 1,
          })),
        },
        ...list,
      ]);
    }
    playVictory();
    setCelebrate(true);
    setTimeout(() => setCelebrate(false), 2800);
    setLiveGame(null);
  }
  const nav = [
    { id: "play", icon: Gamepad2, label: "Play" },
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
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-7">
          <div>
            <p className="text-sm font-bold text-primary">GAME NIGHT</p>
            <h1 className="font-heading text-3xl font-bold">ScoreUp</h1>
          </div>
          <button
            onClick={() => setAddPlayer(true)}
            aria-label="Add player"
            className="grid size-11 place-items-center rounded-full bg-secondary"
          >
            <Users />
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
          />
        )}
        {tab === "ranks" && (
          <RanksView players={players} sessions={sessions} openPlayer={setProfileId} />
        )}
        {tab === "stats" && <StatsView players={players} sessions={sessions} />}
        {tab === "history" && <HistoryView sessions={sessions} />}
      </main>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-xl justify-around px-3 py-2">
          {nav.map((item) => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold ${tab === item.id ? "text-primary" : "text-muted-foreground"}`}
            >
              <item.icon className="size-6" />
              {item.label}
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
          openAddPlayer={() => {
            setSetupGame(null);
            setAddPlayer(true);
          }}
        />
      )}
      {newGame && (
        <NewGameModal
          close={() => setNewGame(false)}
          save={(name: string, type: string) => {
            setGames([
              ...games,
              {
                id: crypto.randomUUID(),
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
          close={() => setAddPlayer(false)}
          save={(name: string, animal: string) => {
            setPlayers([
              ...players,
              { id: crypto.randomUUID(), display_name: name, spirit_animal: animal },
            ]);
            setAddPlayer(false);
          }}
        />
      )}
      {openProfile && (
        <ProfileSheet player={openProfile} sessions={sessions} close={() => setProfileId(null)} />
      )}
    </div>
  );
}

function ProfileSheet({
  player,
  sessions,
  close,
}: {
  player: Player;
  sessions: PastSession[];
  close: () => void;
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
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-background/85 p-4 backdrop-blur-sm sm:place-items-center">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[1.5rem] border border-border bg-card p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="animal-bob inline-block text-5xl">
              {animals[player.spirit_animal] ?? "🦊"}
            </span>
            <div>
              <h2 className="font-heading text-3xl font-bold">{player.display_name}</h2>
              <p className="text-sm text-muted-foreground">{rows.length} games played</p>
            </div>
          </div>
          <Button onClick={close} variant="ghost" size="icon" aria-label="Close profile">
            <X />
          </Button>
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

function AddPlayerModal({
  close,
  save,
}: {
  close: () => void;
  save: (name: string, animal: string) => void;
}) {
  const [name, setName] = useState("");
  const [animal, setAnimal] = useState("fox");
  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-background/80 p-4 backdrop-blur-sm sm:place-items-center">
      <div className="w-full max-w-md rounded-[1.5rem] border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-2xl font-bold">Add a player</h2>
          <Button onClick={close} variant="ghost" size="icon" aria-label="Close">
            <X />
          </Button>
        </div>
        <label htmlFor="player-name" className="mt-5 block text-sm font-bold">
          Name
        </label>
        <input
          id="player-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-2 h-12 w-full rounded-xl border border-border bg-secondary px-4 outline-none focus:border-primary"
          placeholder="Who's joining?"
        />
        <p className="mt-5 text-sm font-bold">Spirit animal</p>
        <div className="mt-2 grid grid-cols-4 gap-2">
          {Object.entries(animals).map(([key, emoji]) => (
            <button
              key={key}
              aria-label={key}
              onClick={() => setAnimal(key)}
              className={`rounded-xl py-3 text-3xl ${animal === key ? "bg-primary" : "bg-secondary"}`}
            >
              {emoji}
            </button>
          ))}
        </div>
        <Button
          disabled={!name.trim()}
          onClick={() => save(name.trim(), animal)}
          className="mt-6 h-12 w-full rounded-xl bg-primary text-primary-foreground"
        >
          Add player
        </Button>
      </div>
    </div>
  );
}

function PlayView({
  games,
  players,
  start,
  openNew,
  openPlayer,
  openAddPlayer,
}: {
  games: Game[];
  players: Player[];
  start: (g: Game) => void;
  openNew: () => void;
  openPlayer: (id: string) => void;
  openAddPlayer: () => void;
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
          <h2 className="font-heading text-3xl font-bold">The squad</h2>
          <button onClick={openAddPlayer} className="font-bold text-primary">
            + Add player
          </button>
        </div>
        <div className="mt-5 flex gap-4 overflow-x-auto pb-2">
          {players.map((p) => (
            <button
              key={p.id}
              onClick={() => openPlayer(p.id)}
              className="min-w-32 rounded-2xl border border-border bg-card p-4 text-center transition hover:border-primary"
            >
              <span className="animal-bob inline-block text-4xl">
                {animals[p.spirit_animal] ?? "🦊"}
              </span>
              <p className="mt-2 font-heading text-lg font-bold">{p.display_name}</p>
              <p className="text-xs text-muted-foreground">Tap profile</p>
            </button>
          ))}
          <button
            onClick={openAddPlayer}
            className="min-w-32 rounded-2xl border border-dashed border-muted-foreground bg-card p-4 text-center"
          >
            <span className="inline-block text-4xl">➕</span>
            <p className="mt-2 font-heading text-lg font-bold">Add name</p>
            <p className="text-xs text-muted-foreground">Join the squad</p>
          </button>
        </div>
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
              {animals[sorted[0]?.spirit_animal]}
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
  const gameNames = [...new Set(sessions.map((s) => s.gameName))].slice(0, 3);
  const radar = stats.slice(0, 4).map((s) => {
    const row: Record<string, string | number> = { game: s.name };
    for (const g of gameNames) {
      const rows = sessions
        .filter((x) => x.gameName === g)
        .flatMap((x) => {
          const r = x.results.find((y) => y.playerId === s.id);
          return r ? [r] : [];
        });
      row[g] = rows.length
        ? Math.round((rows.filter((r) => r.rank === 1).length / rows.length) * 100)
        : 0;
    }
    return row;
  });
  const maxGames = Math.max(0, ...stats.map((s) => s.scores.length));
  const trendRows = Array.from({ length: maxGames }, (_, i) => {
    const row: Record<string, string | number> = { n: `G${i + 1}` };
    for (const s of stats) if (s.scores[i] !== undefined) row[s.name] = s.scores[i]!;
    return row;
  });
  const lineColors = ["var(--primary)", "var(--mint)", "var(--sun)", "var(--muted-foreground)"];
  const top = stats.reduce<PlayerStat | null>(
    (best, s) => (s.games && (!best || s.rate > best.rate) ? s : best),
    null,
  );
  if (sessions.length === 0)
    return (
      <section>
        <p className="font-bold text-primary">PERFORMANCE LAB</p>
        <h2 className="mt-1 font-heading text-4xl font-bold">Squad stats</h2>
        <EmptyStats label="Charts appear once you finish your first game." />
      </section>
    );
  return (
    <section>
      <p className="font-bold text-primary">PERFORMANCE LAB</p>
      <h2 className="mt-1 font-heading text-4xl font-bold">Squad stats</h2>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Chart title="Wins by player">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={stats}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="wins" fill="var(--primary)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Chart>
        <Chart title="Score trend">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendRows}>
              <CartesianGrid stroke="var(--border)" />
              <XAxis dataKey="n" stroke="var(--muted-foreground)" />
              <YAxis stroke="var(--muted-foreground)" />
              <Tooltip />
              <Legend />
              {stats.slice(0, 4).map((s, i) => (
                <Line key={s.id} dataKey={s.name} stroke={lineColors[i]} strokeWidth={3} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </Chart>
        <Chart title="Win rate per game (%)">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radar}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="game" stroke="var(--muted-foreground)" />
              <Tooltip />
              {gameNames.map((g, i) => (
                <Radar
                  key={g}
                  dataKey={g}
                  stroke={lineColors[i]}
                  fill={lineColors[i]}
                  fillOpacity={0.24}
                />
              ))}
            </RadarChart>
          </ResponsiveContainer>
        </Chart>
        <div className="rounded-[1.5rem] border border-border bg-card p-5">
          <p className="text-sm font-bold text-muted-foreground">TOP WIN RATE</p>
          <p className="mt-3 font-heading text-5xl font-bold text-primary">{top?.rate ?? 0}%</p>
          <p className="mt-1 text-lg font-bold">
            {top?.name ?? "—"} · {top?.streak ?? 0} game streak
          </p>
          <div className="mt-6 h-3 overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary" style={{ width: `${top?.rate ?? 0}%` }} />
          </div>
        </div>
      </div>
    </section>
  );
}
function Chart({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-[1.5rem] border border-border bg-card p-5">
      <h3 className="mb-4 font-heading text-xl font-bold">{title}</h3>
      {children}
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
