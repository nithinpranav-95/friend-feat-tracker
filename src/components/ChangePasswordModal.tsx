import { useState } from "react";
import { Check, Eye, EyeOff, KeyRound, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { changePlayerPassword, hasPassword, spiritAnimals } from "@/lib/auth";

export interface ChangePasswordTarget {
  id?: string;
  name: string;
  spirit_animal?: string;
  quote?: string | null;
}

export function ChangePasswordModal({
  player,
  close,
  onSuccess,
}: {
  player: ChangePasswordTarget;
  close: () => void;
  onSuccess?: () => void;
}) {
  const requiresCurrent = hasPassword({
    playerId: player.id,
    playerName: player.name,
    rawQuote: player.quote,
  });

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const animalInfo = (player.spirit_animal && spiritAnimals[player.spirit_animal]) || {
    emoji: "🦊",
    title: player.spirit_animal || "Player",
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (requiresCurrent && !currentPassword) {
      setError("Please enter your current password");
      return;
    }

    if (newPassword.length < 4) {
      setError("New password must be at least 4 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (requiresCurrent && currentPassword === newPassword) {
      setError("New password must be different from current password");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await changePlayerPassword({
        playerId: player.id,
        playerName: player.name,
        currentPassword: requiresCurrent ? currentPassword : undefined,
        newPassword,
      });

      setSuccess(res.message);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        close();
      }, 1000);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Failed to update password. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-background/85 p-4 backdrop-blur-sm sm:place-items-center">
      <div className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-[1.75rem] border border-border bg-card p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid size-12 place-items-center rounded-2xl border border-primary/30 bg-primary/20 text-2xl shadow-inner">
              {animalInfo.emoji}
            </span>
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                <KeyRound className="size-3.5" />
                <span>Security</span>
              </div>
              <h2 className="font-heading text-xl font-bold">
                {requiresCurrent ? "Change Password" : "Set Profile Password"}
              </h2>
              <p className="text-xs text-muted-foreground">
                For <span className="font-bold text-foreground">{player.name}</span>
              </p>
            </div>
          </div>
          <Button onClick={close} variant="ghost" size="icon" aria-label="Close modal">
            <X className="size-4" />
          </Button>
        </div>

        {/* Informational callout if setting first password */}
        {!requiresCurrent && (
          <div className="mt-4 rounded-xl border border-primary/30 bg-primary/10 p-3 text-xs text-muted-foreground">
            💡 No password is set for <strong className="text-foreground">{player.name}</strong>{" "}
            yet. Create a password below to secure this player's profile.
          </div>
        )}

        {/* Feedback alerts */}
        {error && (
          <div className="mt-4 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs font-semibold text-destructive">
            ⚠️ {error}
          </div>
        )}
        {success && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/50 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-400">
            <Check className="size-4" />
            <span>{success}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Current Password (if required) */}
          {requiresCurrent && (
            <div>
              <label
                htmlFor="current-password"
                className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                Current Password
              </label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="current-password"
                  type={showCurrent ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className="h-12 w-full rounded-xl border border-border bg-secondary/80 pl-10 pr-11 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  aria-label={showCurrent ? "Hide password" : "Show password"}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          )}

          {/* New Password */}
          <div>
            <div className="flex items-center justify-between">
              <label
                htmlFor="new-password"
                className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
              >
                New Password
              </label>
              <span className="text-[11px] text-muted-foreground">Min. 4 characters</span>
            </div>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="new-password"
                type={showNew ? "text" : "password"}
                required
                autoComplete="new-password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                className="h-12 w-full rounded-xl border border-border bg-secondary/80 pl-10 pr-11 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                aria-label={showNew ? "Hide password" : "Show password"}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label
              htmlFor="confirm-new-password"
              className="block text-xs font-bold uppercase tracking-wider text-muted-foreground"
            >
              Confirm New Password
            </label>
            <div className="relative mt-1.5">
              <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                id="confirm-new-password"
                type={showNew ? "text" : "password"}
                required
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter new password"
                className="h-12 w-full rounded-xl border border-border bg-secondary/80 pl-10 pr-4 text-sm outline-none transition focus:border-primary focus:ring-1 focus:ring-primary"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={close}
              className="h-12 flex-1 rounded-xl border-border font-bold text-foreground hover:bg-secondary"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 flex-1 rounded-xl bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 font-bold text-white shadow-lg shadow-purple-500/20 transition hover:brightness-110 disabled:opacity-60"
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Saving...</span>
                </span>
              ) : (
                "Update Password"
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
