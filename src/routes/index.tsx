import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { BarChart3, ChevronRight, CirclePlus, Gamepad2, History, LogOut, Minus, Plus, Trophy, Users, Volume2, X } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [
    { title: "ScoreUp — Game Night Scorekeeper" },
    { name: "description", content: "Track live rounds, friend-group rankings and every game-night victory." },
    { property: "og:title", content: "ScoreUp — Game Night Scorekeeper" },
    { property: "og:description", content: "Track live rounds, friend-group rankings and every game-night victory." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ] }),
  component: ScoreUp,
});

type Tab = "play" | "ranks" | "stats" | "history";
type Game = { id: string; name: string; scoring_type: string; high_score_wins: boolean; accent: string };
type Player = { id: string; display_name: string; spirit_animal: string };
type LivePlayer = Player & { score: number };
const animals: Record<string, string> = { fox: "🦊", owl: "🦉", frog: "🐸", bear: "🐻", tiger: "🐯", panda: "🐼", octopus: "🐙", turtle: "🐢" };
const demoPlayers: Player[] = [
  { id: "maya", display_name: "Maya", spirit_animal: "tiger" },
  { id: "nithin", display_name: "Nithin", spirit_animal: "fox" },
  { id: "dev", display_name: "Dev", spirit_animal: "frog" },
  { id: "rita", display_name: "Rita", spirit_animal: "owl" },
];
const demoGames: Game[] = [
  { id: "sevens", name: "Sevens", scoring_type: "points", high_score_wins: false, accent: "lime" },
  { id: "poker", name: "Poker", scoring_type: "points", high_score_wins: true, accent: "yellow" },
  { id: "uno", name: "Uno", scoring_type: "points", high_score_wins: true, accent: "mint" },
];

function ScoreUp() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { setUser(data.user); setLoading(false); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  if (loading) return <div className="grid min-h-screen place-items-center bg-background"><div className="animal-bob text-5xl">🎲</div></div>;
  return user ? <GameApp user={user} /> : <AuthScreen />;
}

function AuthScreen() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setBusy(true); setMessage("");
    const result = mode === "signin" ? await supabase.auth.signInWithPassword({ email, password }) : await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } });
    setBusy(false);
    if (result.error) setMessage(result.error.message);
    else if (mode === "signup" && !result.data.session) setMessage("Check your email to confirm your account.");
  };
  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) setMessage(result.error.message);
  };
  return <main className="min-h-screen bg-background px-5 py-8 text-foreground">
    <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-5xl items-center gap-12 lg:grid-cols-2">
      <section>
        <div className="mb-8 inline-flex size-14 items-center justify-center rounded-2xl bg-primary text-2xl text-primary-foreground">🎲</div>
        <p className="font-bold text-primary">GAME NIGHT, LEVELLED UP</p>
        <h1 className="mt-3 max-w-xl font-heading text-5xl font-bold leading-[1.02] md:text-7xl">Scores remembered. Glory forever.</h1>
        <p className="mt-5 max-w-lg text-lg text-muted-foreground">Run live rounds, settle friendly rivalries and see who really owns game night.</p>
        <div className="mt-8 flex gap-3 text-3xl"><span className="animal-bob">🦊</span><span className="animal-bob [animation-delay:250ms]">🐸</span><span className="animal-bob [animation-delay:500ms]">🦉</span><span className="animal-bob [animation-delay:750ms]">🐯</span></div>
      </section>
      <section className="rounded-[1.5rem] border border-border bg-card p-6 md:p-8">
        <h2 className="font-heading text-3xl font-bold">{mode === "signin" ? "Welcome back" : "Join the squad"}</h2>
        <p className="mt-1 text-muted-foreground">{mode === "signin" ? "Your leaderboard awaits." : "Create your player account."}</p>
        <Button onClick={google} variant="outline" className="mt-6 h-12 w-full rounded-xl border-border bg-secondary text-secondary-foreground hover:bg-subtle">Continue with Google</Button>
        <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />OR<span className="h-px flex-1 bg-border" /></div>
        <div className="space-y-3">
          <input aria-label="Email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" type="email" className="h-12 w-full rounded-xl border border-border bg-secondary px-4 outline-none focus:border-primary" />
          <input aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" type="password" className="h-12 w-full rounded-xl border border-border bg-secondary px-4 outline-none focus:border-primary" />
          <Button disabled={busy || !email || password.length < 6} onClick={submit} className="h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground hover:bg-primary/90">{busy ? "One moment…" : mode === "signin" ? "Sign in" : "Create account"}</Button>
        </div>
        {message && <p role="status" className="mt-4 text-sm text-primary">{message}</p>}
        <button onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="mt-5 w-full text-sm font-bold text-muted-foreground hover:text-foreground">{mode === "signin" ? "New here? Create an account" : "Already playing? Sign in"}</button>
      </section>
    </div>
  </main>;
}

function GameApp({ user }: { user: User }) {
  const [tab, setTab] = useState<Tab>("play");
  const [profile, setProfile] = useState<Player | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [games, setGames] = useState<Game[]>(demoGames);
  const [players, setPlayers] = useState<Player[]>(demoPlayers);
  const [setupName, setSetupName] = useState(user.user_metadata?.full_name ?? "");
  const [setupAnimal, setSetupAnimal] = useState("fox");
  const [setupGroup, setSetupGroup] = useState("Friday Night Crew");
  const [setup, setSetup] = useState(true);
  const [liveGame, setLiveGame] = useState<Game | null>(null);
  const [livePlayers, setLivePlayers] = useState<LivePlayer[]>([]);
  const [round, setRound] = useState(1);
  const [celebrate, setCelebrate] = useState(false);
  const [newGame, setNewGame] = useState(false);

  useEffect(() => { void load(); }, []);
  async function load() {
    const { data: p } = await supabase.from("profiles").select("id,display_name,spirit_animal").eq("id", user.id).maybeSingle();
    if (!p) { setSetup(true); return; }
    setProfile(p); setSetup(false);
    const { data: memberships } = await supabase.from("group_members").select("group_id").eq("user_id", user.id).limit(1);
    const gid = memberships?.[0]?.group_id;
    if (!gid) return;
    setGroupId(gid);
    const [{ data: gameRows }, { data: memberRows }] = await Promise.all([
      supabase.from("games").select("id,name,scoring_type,high_score_wins,accent").eq("group_id", gid),
      supabase.from("group_members").select("user_id, profiles!group_members_user_id_fkey(id,display_name,spirit_animal)").eq("group_id", gid),
    ]);
    if (gameRows?.length) setGames(gameRows as Game[]);
    const mapped = (memberRows ?? []).flatMap((row: any) => row.profiles ? [row.profiles as Player] : []);
    if (mapped.length) setPlayers(mapped);
  }
  async function finishSetup() {
    if (!setupName.trim()) return;
    const { error: profileError } = await supabase.from("profiles").upsert({ id: user.id, display_name: setupName.trim(), spirit_animal: setupAnimal });
    if (profileError) return;
    const { data: group } = await supabase.from("groups").insert({ name: setupGroup.trim() || "Game Night", created_by: user.id }).select("id").single();
    setProfile({ id: user.id, display_name: setupName.trim(), spirit_animal: setupAnimal });
    if (group) setGroupId(group.id);
    setSetup(false); void load();
  }
  function startGame(game: Game) { setLiveGame(game); setLivePlayers(players.map((p) => ({ ...p, score: 0 }))); setRound(1); }
  function adjust(id: string, by: number) { setLivePlayers((list) => list.map((p) => p.id === id ? { ...p, score: p.score + by } : p)); }
  async function endGame() {
    if (groupId && liveGame && livePlayers.length) {
      const { data: session } = await supabase.from("game_sessions").insert({ group_id: groupId, game_id: liveGame.id, started_by: user.id, status: "completed", ended_at: new Date().toISOString() }).select("id").single();
      if (session) {
        const sorted = [...livePlayers].sort((a,b) => liveGame.high_score_wins ? b.score-a.score : a.score-b.score);
        await supabase.from("session_players").insert(sorted.map((p,i) => ({ session_id: session.id, player_id: p.id, final_score: p.score, final_rank: i+1, is_winner: i===0 })));
      }
    }
    playVictory(); setCelebrate(true); setTimeout(() => setCelebrate(false), 2800); setLiveGame(null);
  }
  const nav = [{ id:"play", icon:Gamepad2, label:"Play" }, { id:"ranks", icon:Trophy, label:"Ranks" }, { id:"stats", icon:BarChart3, label:"Stats" }, { id:"history", icon:History, label:"History" }] as const;
  if (setup) return <Setup name={setupName} setName={setSetupName} animal={setupAnimal} setAnimal={setSetupAnimal} group={setupGroup} setGroup={setSetupGroup} done={finishSetup} />;
  if (liveGame) return <LiveSession game={liveGame} players={livePlayers} round={round} setRound={setRound} adjust={adjust} end={endGame} close={() => setLiveGame(null)} />;
  return <div className="min-h-screen bg-background pb-24 text-foreground">
    {celebrate && <Confetti />}
    <header className="border-b border-border"><div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-5 md:px-7"><div><p className="text-sm font-bold text-primary">GAME NIGHT</p><h1 className="font-heading text-3xl font-bold">{profile?.display_name}</h1></div><div className="flex items-center gap-3"><button aria-label="Friends" className="grid size-11 place-items-center rounded-full bg-secondary"><Users /></button><button aria-label="Sign out" onClick={() => supabase.auth.signOut()} className="grid size-11 place-items-center rounded-full bg-secondary text-muted-foreground"><LogOut className="size-5" /></button></div></div></header>
    <main className="mx-auto max-w-6xl px-4 py-8 md:px-7">
      {tab === "play" && <PlayView games={games} players={players} start={startGame} openNew={() => setNewGame(true)} />}
      {tab === "ranks" && <RanksView players={players} />}
      {tab === "stats" && <StatsView players={players} />}
      {tab === "history" && <HistoryView />}
    </main>
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface/95 backdrop-blur"><div className="mx-auto flex max-w-xl justify-around px-3 py-2">{nav.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`flex min-w-16 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold ${tab === item.id ? "text-primary" : "text-muted-foreground"}`}><item.icon className="size-6" />{item.label}</button>)}</div></nav>
    {newGame && <NewGameModal close={() => setNewGame(false)} save={async (name,type) => { if (!groupId) return; const { data } = await supabase.from("games").insert({ group_id: groupId, name, scoring_type: type, high_score_wins: true, created_by: user.id }).select("id,name,scoring_type,high_score_wins,accent").single(); if (data) setGames([...games, data as Game]); setNewGame(false); }} />}
  </div>;
}

function Setup({ name,setName,animal,setAnimal,group,setGroup,done }: any) {
  return <main className="grid min-h-screen place-items-center bg-background p-5"><section className="w-full max-w-lg rounded-[1.5rem] border border-border bg-card p-6"><p className="font-bold text-primary">CREATE YOUR PLAYER</p><h1 className="mt-2 font-heading text-4xl font-bold">Pick your game-night identity</h1><label className="mt-6 block text-sm font-bold">Your name</label><input value={name} onChange={(e)=>setName(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-border bg-secondary px-4 outline-none focus:border-primary" placeholder="How friends know you" /><label className="mt-5 block text-sm font-bold">Spirit animal</label><div className="mt-3 grid grid-cols-4 gap-2">{Object.entries(animals).map(([key,emoji]) => <button key={key} onClick={()=>setAnimal(key)} className={`grid h-16 place-items-center rounded-xl text-3xl ${animal===key ? "bg-primary ring-2 ring-primary" : "bg-secondary"}`}><span className="animal-bob">{emoji}</span></button>)}</div><label className="mt-5 block text-sm font-bold">Group name</label><input value={group} onChange={(e)=>setGroup(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-border bg-secondary px-4 outline-none focus:border-primary" /><Button onClick={done} disabled={!name.trim()} className="mt-6 h-12 w-full rounded-xl bg-primary font-bold text-primary-foreground">Enter game night <ChevronRight /></Button></section></main>;
}

function PlayView({ games, players, start, openNew }: { games:Game[];players:Player[];start:(g:Game)=>void;openNew:()=>void }) {
  return <><section><h2 className="font-heading text-3xl font-bold">Start a game</h2><div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">{games.map((game,i) => <button key={game.id} onClick={()=>start(game)} className="group min-h-44 rounded-[1.5rem] border border-border bg-card p-5 text-left transition hover:-translate-y-1 hover:border-primary"><span className={`grid size-14 place-items-center rounded-2xl text-background ${i%3===0?"bg-primary":i%3===1?"bg-sun":"bg-mint"}`}><Gamepad2 /></span><h3 className="mt-5 font-heading text-2xl font-bold">{game.name}</h3><p className="mt-1 text-sm text-muted-foreground">{game.scoring_type.replace("_"," · ")} · {game.high_score_wins?"High":"Low"} wins</p></button>)}<button onClick={openNew} className="min-h-44 rounded-[1.5rem] border border-dashed border-muted-foreground bg-card p-5 text-left"><span className="grid size-14 place-items-center rounded-2xl bg-secondary text-primary"><Plus /></span><h3 className="mt-5 font-heading text-2xl font-bold">New game</h3><p className="mt-1 text-sm text-muted-foreground">Add your own rules</p></button></div></section><section className="mt-10"><div className="flex items-center justify-between"><h2 className="font-heading text-3xl font-bold">The squad</h2><button className="font-bold text-primary">Manage</button></div><div className="mt-5 flex gap-4 overflow-x-auto pb-2">{players.map(p=><button key={p.id} className="min-w-32 rounded-2xl border border-border bg-card p-4 text-center"><span className="animal-bob inline-block text-4xl">{animals[p.spirit_animal]??"🦊"}</span><p className="mt-2 font-heading text-lg font-bold">{p.display_name}</p><p className="text-xs text-muted-foreground">Tap profile</p></button>)}</div></section></>;
}

function LiveSession({ game,players,round,setRound,adjust,end,close }: any) {
  const sorted=[...players].sort((a,b)=>game.high_score_wins?b.score-a.score:a.score-b.score);
  return <main className="min-h-screen bg-background pb-28"><header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-4 backdrop-blur"><div className="mx-auto flex max-w-2xl items-center justify-between"><Button onClick={close} variant="ghost" size="icon" aria-label="Close"><X /></Button><div className="text-center"><p className="text-xs font-bold text-primary">LIVE · ROUND {round}</p><h1 className="font-heading text-xl font-bold">{game.name}</h1></div><Button onClick={end} className="rounded-xl bg-primary text-primary-foreground">Finish</Button></div></header><div className="mx-auto max-w-2xl px-4 py-5"><div className="mb-5 flex items-center justify-between rounded-2xl bg-primary p-4 text-primary-foreground"><div><p className="text-xs font-bold">CURRENT LEADER</p><p className="font-heading text-2xl font-bold">{sorted[0]?.display_name}</p></div><div className="text-right"><span className="animal-bob inline-block text-3xl">{animals[sorted[0]?.spirit_animal]}</span><p className="text-3xl font-black tabular-nums">{sorted[0]?.score}</p></div></div><div className="space-y-3">{players.map((p:LivePlayer)=><div key={p.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3"><span className="grid size-12 place-items-center rounded-xl bg-secondary text-2xl">{animals[p.spirit_animal]}</span><p className="min-w-0 flex-1 truncate font-heading text-lg font-bold">{p.display_name}</p><Button aria-label={`Subtract from ${p.display_name}`} onClick={()=>adjust(p.id,-1)} variant="secondary" size="icon" className="size-12 rounded-xl"><Minus /></Button><span key={p.score} className="score-pop w-14 text-center text-3xl font-black tabular-nums">{p.score}</span><Button aria-label={`Add to ${p.display_name}`} onClick={()=>adjust(p.id,1)} size="icon" className="size-12 rounded-xl bg-primary text-primary-foreground"><Plus /></Button></div>)}</div></div><div className="fixed inset-x-0 bottom-0 border-t border-border bg-surface p-4"><Button onClick={()=>setRound((r:number)=>r+1)} className="mx-auto flex h-14 w-full max-w-2xl rounded-xl bg-primary text-base font-bold text-primary-foreground"><CirclePlus /> Save round {round}</Button></div></main>;
}

const statData=[{name:"Maya",wins:12,rate:68},{name:"Nithin",wins:10,rate:61},{name:"Dev",wins:8,rate:53},{name:"Rita",wins:7,rate:47}];
const trend=[{n:"Jan",Maya:31,Nithin:24},{n:"Feb",Maya:42,Nithin:35},{n:"Mar",Maya:38,Nithin:44},{n:"Apr",Maya:57,Nithin:48},{n:"May",Maya:66,Nithin:59}];
function RanksView({players}:{players:Player[]}) { return <section><p className="font-bold text-primary">ALL GAMES · ALL TIME</p><h2 className="mt-1 font-heading text-4xl font-bold">Leaderboard</h2><div className="mt-6 overflow-hidden rounded-[1.5rem] border border-border bg-card">{players.map((p,i)=><div key={p.id} className="flex items-center gap-4 border-b border-border p-4 last:border-0"><span className={`grid size-10 place-items-center rounded-xl font-black ${i===0?"bg-primary text-primary-foreground":"bg-secondary"}`}>{i+1}</span><span className="text-3xl">{animals[p.spirit_animal]}</span><div className="flex-1"><p className="font-heading text-lg font-bold">{p.display_name}</p><p className="text-sm text-muted-foreground">{statData[i]?.wins??5} wins · {190-i*22} pts</p></div><Trophy className={i===0?"text-primary":"text-muted-foreground"}/></div>)}</div></section>; }
function StatsView({players}:{players:Player[]}) { const radar=players.slice(0,4).map((p,i)=>({game:p.display_name,Uno:88-i*12,Poker:55+i*8,Sevens:72-i*4})); return <section><p className="font-bold text-primary">PERFORMANCE LAB</p><h2 className="mt-1 font-heading text-4xl font-bold">Squad stats</h2><div className="mt-6 grid gap-4 lg:grid-cols-2"><Chart title="Wins by player"><ResponsiveContainer width="100%" height={260}><BarChart data={statData}><CartesianGrid stroke="var(--border)" vertical={false}/><XAxis dataKey="name" stroke="var(--muted-foreground)"/><YAxis stroke="var(--muted-foreground)"/><Tooltip/><Bar dataKey="wins" fill="var(--primary)" radius={[8,8,0,0]}/></BarChart></ResponsiveContainer></Chart><Chart title="Score trend"><ResponsiveContainer width="100%" height={260}><LineChart data={trend}><CartesianGrid stroke="var(--border)"/><XAxis dataKey="n" stroke="var(--muted-foreground)"/><YAxis stroke="var(--muted-foreground)"/><Tooltip/><Legend/><Line dataKey="Maya" stroke="var(--primary)" strokeWidth={3}/><Line dataKey="Nithin" stroke="var(--mint)" strokeWidth={3}/></LineChart></ResponsiveContainer></Chart><Chart title="All games comparison"><ResponsiveContainer width="100%" height={300}><RadarChart data={radar}><PolarGrid stroke="var(--border)"/><PolarAngleAxis dataKey="game" stroke="var(--muted-foreground)"/><Radar dataKey="Uno" stroke="var(--primary)" fill="var(--primary)" fillOpacity={.32}/><Radar dataKey="Poker" stroke="var(--sun)" fill="var(--sun)" fillOpacity={.18}/></RadarChart></ResponsiveContainer></Chart><div className="rounded-[1.5rem] border border-border bg-card p-5"><p className="text-sm font-bold text-muted-foreground">TOP WIN RATE</p><p className="mt-3 font-heading text-5xl font-bold text-primary">68%</p><p className="mt-1 text-lg font-bold">Maya · 4 game streak</p><div className="mt-6 h-3 overflow-hidden rounded-full bg-secondary"><div className="h-full w-[68%] bg-primary"/></div></div></div></section>; }
function Chart({title,children}:{title:string;children:React.ReactNode}) { return <div className="rounded-[1.5rem] border border-border bg-card p-5"><h3 className="mb-4 font-heading text-xl font-bold">{title}</h3>{children}</div>; }
function HistoryView() { return <section><p className="font-bold text-primary">THE ARCHIVES</p><h2 className="mt-1 font-heading text-4xl font-bold">Session history</h2><div className="mt-6 space-y-3">{[{g:"Uno",w:"Maya",d:"Today · 9 rounds",s:"142 pts"},{g:"Poker",w:"Nithin",d:"12 Sep · 6 hands",s:"€86 pot"},{g:"Sevens",w:"Rita",d:"5 Sep · 4 rounds",s:"18 pts"}].map(x=><div key={x.d} className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"><span className="grid size-12 place-items-center rounded-xl bg-secondary text-2xl">🏆</span><div className="flex-1"><p className="font-heading text-lg font-bold">{x.g} · {x.w} won</p><p className="text-sm text-muted-foreground">{x.d}</p></div><p className="font-bold text-primary">{x.s}</p></div>)}</div></section>; }

function NewGameModal({close,save}:any) { const [name,setName]=useState(""); const [type,setType]=useState("points"); return <div className="fixed inset-0 z-50 grid place-items-end bg-background/80 p-4 backdrop-blur-sm sm:place-items-center"><div className="w-full max-w-md rounded-[1.5rem] border border-border bg-card p-6"><div className="flex items-center justify-between"><h2 className="font-heading text-2xl font-bold">Add a game</h2><Button onClick={close} variant="ghost" size="icon"><X/></Button></div><label className="mt-5 block text-sm font-bold">Game name</label><input value={name} onChange={e=>setName(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-border bg-secondary px-4 outline-none focus:border-primary" placeholder="Rummy, Catan, Darts…"/><label className="mt-5 block text-sm font-bold">Scoring type</label><div className="mt-2 grid grid-cols-3 gap-2">{["points","win_loss","ranked"].map(t=><button key={t} onClick={()=>setType(t)} className={`rounded-xl px-2 py-3 text-sm font-bold ${type===t?"bg-primary text-primary-foreground":"bg-secondary"}`}>{t.replace("_"," / ")}</button>)}</div><Button disabled={!name.trim()} onClick={()=>save(name,type)} className="mt-6 h-12 w-full rounded-xl bg-primary text-primary-foreground">Add game</Button></div></div>; }
function Confetti(){ return <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden">{Array.from({length:36},(_,i)=><i key={i} className={`absolute top-0 size-2 ${i%3===0?"bg-primary":i%3===1?"bg-sun":"bg-mint"}`} style={{left:`${(i*29)%100}%`,animation:`confetti-fall ${1.7+(i%5)*.2}s ease-in ${(i%9)*.08}s both`}}/>)}</div>; }
function playVictory(){ try { const AudioContextCtor=window.AudioContext || (window as any).webkitAudioContext; const ctx=new AudioContextCtor(); [523,659,784,1047].forEach((f,i)=>{const o=ctx.createOscillator();const g=ctx.createGain();o.connect(g);g.connect(ctx.destination);o.frequency.value=f;g.gain.setValueAtTime(.08,ctx.currentTime+i*.1);g.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+i*.1+.28);o.start(ctx.currentTime+i*.1);o.stop(ctx.currentTime+i*.1+.3);}); } catch { /* sound is optional */ } }