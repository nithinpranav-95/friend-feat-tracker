import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import {
  ArrowLeft,
  Check,
  Eye,
  EyeOff,
  Gamepad2,
  Lock,
  LogIn,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  signInWithNameAndPassword,
  signUpWithNameAndPassword,
  spiritAnimals,
  useAuth,
  signOut,
} from "@/lib/auth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign In / Sign Up — ScoreUp" },
      {
        name: "description",
        content: "Sign in with your name and password or create a player profile for ScoreUp.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [animal, setAnimal] = useState("lion");
  const [quote, setQuote] = useState(spiritAnimals.lion?.defaultQuote || "Bold & fearless");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function handleSelectAnimal(key: string) {
    setAnimal(key);
    const prevDefault = spiritAnimals[animal]?.defaultQuote;
    if (!quote || quote === prevDefault) {
      setQuote(spiritAnimals[key]?.defaultQuote || "");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter your name");
      return;
    }

    if (!password) {
      setError("Please enter your password");
      return;
    }

    if (mode === "signup") {
      if (password.length < 4) {
        setError("Password must be at least 4 characters");
        return;
      }
      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    setIsSubmitting(true);
    try {
      if (mode === "login") {
        const { user: loggedInUser } = await signInWithNameAndPassword({
          name: trimmedName,
          password,
        });
        setSuccess(`Welcome back, ${loggedInUser.name}! Redirecting...`);
        setTimeout(() => {
          navigate({ to: "/" });
        }, 800);
      } else {
        const { user: createdUser } = await signUpWithNameAndPassword({
          name: trimmedName,
          password,
          spirit_animal: animal,
          quote: quote.trim() || undefined,
        });
        setSuccess(`Welcome to the squad, ${createdUser.name}! Redirecting...`);
        setTimeout(() => {
          navigate({ to: "/" });
        }, 800);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-between bg-background text-foreground">
      {/* Retro Squad Atmospheric Background */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <img
          src="/squad-bg.jpg"
          alt="Squad background"
          className="size-full object-cover object-top opacity-30 filter saturate-75 contrast-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/70 via-background/85 to-background" />
      </div>

      {/* Top Header */}
      <header className="relative z-20 border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 md:px-7">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-xs font-bold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <ArrowLeft className="size-4" />
            <span>Back to Game Board</span>
          </Link>

          <Link to="/" className="flex items-center gap-2 transition hover:opacity-90">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-lg font-bold text-primary-foreground shadow-md">
              🎲
            </span>
            <span className="font-heading text-xl font-bold tracking-tight">ScoreUp</span>
          </Link>
        </div>
      </header>

      {/* Main Form Content */}
      <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10 md:py-14">
        <div className="w-full max-w-md rounded-[2rem] border border-border/80 bg-card/90 p-6 shadow-2xl backdrop-blur-xl sm:p-8">
          {user ? (
            /* Already Logged In State */
            <div className="space-y-6 text-center">
              <div className="mx-auto grid size-20 place-items-center rounded-3xl border border-primary/30 bg-primary/20 text-4xl shadow-inner">
                {spiritAnimals[user.spirit_animal]?.emoji || "🦊"}
              </div>
              <div>
                <span className="rounded-full bg-primary/20 px-3 py-1 text-xs font-bold text-primary">
                  Currently Logged In
                </span>
                <h1 className="mt-2 font-heading text-3xl font-bold">{user.name}</h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  {spiritAnimals[user.spirit_animal]?.title || user.spirit_animal} ·{" "}
                  <span className="italic">"{user.quote || "Ready for game night"}"</span>
                </p>
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <Button
                  onClick={() => navigate({ to: "/" })}
                  className="h-12 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 font-bold text-white shadow-lg shadow-purple-500/20 hover:brightness-110"
                >
                  <Gamepad2 className="mr-2 size-4" /> Go to Game Dashboard
                </Button>
                <Button
                  onClick={() => {
                    signOut();
                    setSuccess("Signed out successfully.");
                  }}
                  variant="outline"
                  className="h-12 rounded-xl border-border font-bold text-foreground hover:bg-secondary"
                >
                  Sign Out / Switch Account
                </Button>
              </div>
            </div>
          ) : (
            /* Sign In / Sign Up Form */
            <div>
              {/* Segmented Mode Toggle */}
              <div className="flex rounded-2xl border border-border/80 bg-secondary/60 p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setError(null);
                    setSuccess(null);
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                    mode === "login"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LogIn className="size-4" />
                  <span>Log In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setError(null);
                    setSuccess(null);
                  }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition ${
                    mode === "signup"
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserPlus className="size-4" />
                  <span>Sign Up</span>
                </button>
              </div>

              {/* Title Header */}
              <div className="mt-6 text-center">
                <h1 className="font-heading text-2xl font-bold sm:text-3xl">
                  {mode === "login" ? "Welcome Back" : "Join ScoreUp Squad"}
                </h1>
                <p className="mt-1.5 text-xs text-muted-foreground sm:text-sm">
                  {mode === "login"
                    ? "Enter your name and password to access your game night stats"
                    : "Create a persistent player profile with a name, avatar & password"}
                </p>
              </div>

              {/* Feedback Alerts */}
              {error && (
                <div className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 p-3.5 text-xs font-semibold text-destructive">
                  ⚠️ {error}
                </div>
              )}
              {success && (
                <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3.5 text-xs font-semibold text-emerald-400">
                  <Check className="size-4" />
                  <span>{success}</span>
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Name / Nickname Input */}
                <div>
                  <label
                    htmlFor="auth-name"
                    className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    Name or Nickname
                  </label>
                  <div className="relative mt-1.5">
                    <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="auth-name"
                      type="text"
                      required
                      autoComplete="username"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Jordan"
                      className="h-12 w-full rounded-xl border border-border bg-secondary/80 pl-10 pr-4 text-sm font-semibold outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>

                {/* Additional fields for Sign Up */}
                {mode === "signup" && (
                  <>
                    {/* Spirit Animal Selector */}
                    <div>
                      <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          Choose Spirit Animal
                        </label>
                        <span className="text-xs font-bold text-primary">
                          {spiritAnimals[animal]?.emoji} {spiritAnimals[animal]?.title}
                        </span>
                      </div>
                      <div className="mt-2 grid max-h-36 grid-cols-4 gap-2 overflow-y-auto rounded-xl border border-border/70 bg-secondary/40 p-2 sm:grid-cols-6">
                        {Object.entries(spiritAnimals).map(([key, info]) => (
                          <button
                            key={key}
                            type="button"
                            onClick={() => handleSelectAnimal(key)}
                            title={info.title}
                            className={`flex flex-col items-center justify-center rounded-xl p-2 transition ${
                              animal === key
                                ? "bg-primary font-bold text-primary-foreground shadow-sm scale-105"
                                : "bg-card text-muted-foreground hover:bg-secondary hover:text-foreground"
                            }`}
                          >
                            <span className="text-2xl">{info.emoji}</span>
                            <span className="mt-1 line-clamp-1 text-[10px] leading-tight">
                              {info.title.split(" ")[1] || info.title}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Catchphrase / Quote */}
                    <div>
                      <label
                        htmlFor="auth-quote"
                        className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
                      >
                        Catchphrase / Quote (Optional)
                      </label>
                      <div className="relative mt-1.5">
                        <Sparkles className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <input
                          id="auth-quote"
                          type="text"
                          value={quote}
                          onChange={(e) => setQuote(e.target.value)}
                          placeholder='e.g. "Bold & fearless"'
                          className="h-12 w-full rounded-xl border border-border bg-secondary/80 pl-10 pr-4 text-sm italic outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="auth-password"
                      className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      Password
                    </label>
                    {mode === "signup" && (
                      <span className="text-[11px] text-muted-foreground">Min. 4 characters</span>
                    )}
                  </div>
                  <div className="relative mt-1.5">
                    <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      id="auth-password"
                      type={showPassword ? "text" : "password"}
                      required
                      autoComplete={mode === "login" ? "current-password" : "new-password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={mode === "signup" ? "Create a password" : "Enter your password"}
                      className="h-12 w-full rounded-xl border border-border bg-secondary/80 pl-10 pr-11 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password for Sign Up */}
                {mode === "signup" && (
                  <div>
                    <label
                      htmlFor="auth-confirm-password"
                      className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
                    >
                      Confirm Password
                    </label>
                    <div className="relative mt-1.5">
                      <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                      <input
                        id="auth-confirm-password"
                        type={showPassword ? "text" : "password"}
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-enter your password"
                        className="h-12 w-full rounded-xl border border-border bg-secondary/80 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-6 h-12 w-full rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 font-bold text-white shadow-lg shadow-purple-500/25 transition hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>{mode === "login" ? "Signing In..." : "Creating Account..."}</span>
                    </span>
                  ) : mode === "login" ? (
                    <span className="flex items-center gap-2">
                      <LogIn className="size-4" />
                      <span>Sign In to ScoreUp</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <UserPlus className="size-4" />
                      <span>Create Account & Join Squad</span>
                    </span>
                  )}
                </Button>
              </form>

              {/* Mode switch helper link */}
              <div className="mt-6 text-center text-xs text-muted-foreground">
                {mode === "login" ? (
                  <p>
                    Don't have an account yet?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("signup");
                        setError(null);
                        setSuccess(null);
                      }}
                      className="font-bold text-primary underline underline-offset-4 hover:brightness-110"
                    >
                      Sign up now
                    </button>
                  </p>
                ) : (
                  <p>
                    Already have an account?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setError(null);
                        setSuccess(null);
                      }}
                      className="font-bold text-primary underline underline-offset-4 hover:brightness-110"
                    >
                      Log in here
                    </button>
                  </p>
                )}
              </div>

              {/* Guest option */}
              <div className="mt-5 border-t border-border/60 pt-4 text-center">
                <Link
                  to="/"
                  className="text-xs font-semibold text-muted-foreground transition hover:text-foreground"
                >
                  Or continue playing as guest →
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-muted-foreground">
        ScoreUp Game Night · Live scoring and glory for your friend group
      </footer>
    </div>
  );
}
