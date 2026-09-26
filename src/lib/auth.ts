import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AnimalInfo = {
  emoji: string;
  title: string;
  defaultQuote: string;
  badgeBg: string;
};

export const spiritAnimals: Record<string, AnimalInfo> = {
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

export interface AuthUser {
  id: string;
  name: string;
  spirit_animal: string;
  quote?: string;
}

export interface StoredAccount {
  id: string;
  name: string;
  spirit_animal: string;
  quote?: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

const AUTH_USER_KEY = "scoreup_current_user";
const AUTH_ACCOUNTS_KEY = "scoreup_accounts";
const AUTH_EVENT_NAME = "scoreup_auth_change";

export async function hashPassword(password: string, salt: string): Promise<string> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits"],
  );
  const key = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      salt: enc.encode(salt),
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    256,
  );
  return Array.from(new Uint8Array(key))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function generateSalt(): string {
  const array = new Uint8Array(16);
  crypto.getRandomValues(array);
  return Array.from(array)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Strips the internal `__AUTH__:` payload from a quote string so that
 * the user's catchphrase is clean in the UI.
 */
export function cleanQuote(rawQuote?: string | null): string {
  if (!rawQuote) return "";
  return (rawQuote.split("__AUTH__:")[0] ?? "").trim();
}

export function parseQuoteAuth(rawQuote?: string | null): {
  clean: string;
  auth?: { salt: string; hash: string };
} {
  if (!rawQuote) return { clean: "" };
  const parts = rawQuote.split("__AUTH__:");
  const clean = (parts[0] ?? "").trim();
  if (parts.length > 1) {
    try {
      const auth = JSON.parse(parts[1] ?? "");
      return { clean, auth };
    } catch {
      return { clean };
    }
  }
  return { clean };
}

export function encodeQuoteAuth(quote: string, salt: string, hash: string): string {
  const clean = cleanQuote(quote);
  const authPayload = JSON.stringify({ salt, hash });
  return clean ? `${clean} __AUTH__:${authPayload}` : `__AUTH__:${authPayload}`;
}

export function getLocalAccounts(): StoredAccount[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUTH_ACCOUNTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAccount(account: StoredAccount) {
  if (typeof window === "undefined") return;
  try {
    const accounts = getLocalAccounts().filter(
      (a) => a.name.toLowerCase() !== account.name.toLowerCase(),
    );
    accounts.push(account);
    localStorage.setItem(AUTH_ACCOUNTS_KEY, JSON.stringify(accounts));
  } catch (e) {
    console.debug("Failed to save local account:", e);
  }
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(AUTH_USER_KEY);
    }
    window.dispatchEvent(new Event(AUTH_EVENT_NAME));
  } catch (e) {
    console.debug("Failed to set current user:", e);
  }
}

export function signOut() {
  setCurrentUser(null);
}

export async function signUpWithNameAndPassword({
  name,
  password,
  spirit_animal,
  quote,
}: {
  name: string;
  password: string;
  spirit_animal: string;
  quote?: string | undefined;
}): Promise<{ user: AuthUser }> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Please enter your name");
  }
  if (password.length < 4) {
    throw new Error("Password must be at least 4 characters");
  }

  const salt = generateSalt();
  const passwordHash = await hashPassword(password, salt);
  const finalQuote =
    quote?.trim() || spiritAnimals[spirit_animal]?.defaultQuote || "Bold & fearless";
  const storedQuote = encodeQuoteAuth(finalQuote, salt, passwordHash);

  // Check if player with this name already exists in Supabase
  let existingId: string | null = null;
  try {
    const { data } = await supabase
      .from("players")
      .select("id, name, quote, spirit_animal")
      .ilike("name", trimmedName);

    const existing = data?.[0];
    if (existing) {
      const parsed = parseQuoteAuth(existing.quote);
      if (parsed.auth) {
        throw new Error(`An account with the name "${trimmedName}" already exists. Please log in.`);
      }
      // If player exists without a password (e.g. added during a game), claim it!
      existingId = existing.id;
    }
  } catch (err: unknown) {
    if (err instanceof Error && err.message.includes("already exists")) {
      throw err;
    }
    console.debug("Supabase lookup check error:", err);
  }

  let user: AuthUser;

  if (existingId) {
    // Update existing player with password
    await supabase
      .from("players")
      .update({
        quote: storedQuote,
        spirit_animal,
      })
      .eq("id", existingId);

    user = {
      id: existingId,
      name: trimmedName,
      spirit_animal,
      quote: finalQuote,
    };
  } else {
    // Insert new player into Supabase
    const { data, error } = await supabase
      .from("players")
      .insert({
        name: trimmedName,
        spirit_animal,
        quote: storedQuote,
      })
      .select()
      .single();

    if (error || !data) {
      // Fallback: create local user if database is unreachable
      const newId = crypto.randomUUID();
      user = {
        id: newId,
        name: trimmedName,
        spirit_animal,
        quote: finalQuote,
      };
    } else {
      user = {
        id: data.id,
        name: data.name,
        spirit_animal: data.spirit_animal,
        quote: finalQuote,
      };
    }
  }

  // Save to local accounts cache
  saveLocalAccount({
    id: user.id,
    name: user.name,
    spirit_animal: user.spirit_animal,
    quote: finalQuote,
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
  });

  setCurrentUser(user);
  return { user };
}

export async function signInWithNameAndPassword({
  name,
  password,
}: {
  name: string;
  password: string;
}): Promise<{ user: AuthUser }> {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("Please enter your name");
  }
  if (!password) {
    throw new Error("Please enter your password");
  }

  // First check local accounts cache
  const localAccounts = getLocalAccounts();
  const localMatch = localAccounts.find((a) => a.name.toLowerCase() === trimmedName.toLowerCase());

  // Also query Supabase Cloud DB for the latest record
  let cloudPlayer: {
    id: string;
    name: string;
    quote: string | null;
    spirit_animal: string;
  } | null = null;

  try {
    const { data } = await supabase
      .from("players")
      .select("id, name, quote, spirit_animal")
      .ilike("name", trimmedName);

    cloudPlayer = data?.[0] ?? null;
  } catch (e) {
    console.debug("Supabase lookup during login error:", e);
  }

  // Determine auth source: cloudPlayer with __AUTH__ payload or localMatch
  let salt: string | undefined;
  let expectedHash: string | undefined;
  const targetId = cloudPlayer?.id || localMatch?.id || crypto.randomUUID();
  const targetAnimal = cloudPlayer?.spirit_animal || localMatch?.spirit_animal || "fox";
  const targetQuote = cleanQuote(cloudPlayer?.quote || localMatch?.quote || "Game night ready");

  if (cloudPlayer?.quote) {
    const parsed = parseQuoteAuth(cloudPlayer.quote);
    if (parsed.auth) {
      salt = parsed.auth.salt;
      expectedHash = parsed.auth.hash;
    }
  }

  if (!salt && localMatch) {
    salt = localMatch.salt;
    expectedHash = localMatch.passwordHash;
  }

  if (!cloudPlayer && !localMatch) {
    throw new Error(`No player named "${trimmedName}" found. Please sign up to create an account.`);
  }

  if (!salt || !expectedHash) {
    // Player exists in squad but hasn't set a password yet
    throw new Error(
      `"${trimmedName}" is in the squad roster, but hasn't set a password yet. Please switch to "Sign Up" to secure your profile with a password.`,
    );
  }

  // Verify password hash
  const computedHash = await hashPassword(password, salt);
  if (computedHash !== expectedHash) {
    throw new Error("Incorrect password. Please try again.");
  }

  const user: AuthUser = {
    id: targetId,
    name: cloudPlayer?.name || localMatch?.name || trimmedName,
    spirit_animal: targetAnimal,
    quote: targetQuote,
  };

  setCurrentUser(user);
  return { user };
}

/**
 * React hook to listen for authentication state changes
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(getCurrentUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);

    function handleAuthChange() {
      setUser(getCurrentUser());
    }

    window.addEventListener(AUTH_EVENT_NAME, handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener(AUTH_EVENT_NAME, handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  return { user, loading, signOut };
}

export function hasPassword({
  playerName,
  rawQuote,
}: {
  playerId?: string;
  playerName?: string;
  rawQuote?: string | null;
}): boolean {
  if (rawQuote) {
    const parsed = parseQuoteAuth(rawQuote);
    if (parsed.auth) return true;
  }
  if (playerName) {
    const localAccounts = getLocalAccounts();
    const match = localAccounts.find(
      (a) => a.name.toLowerCase() === playerName.trim().toLowerCase(),
    );
    if (match?.passwordHash) return true;
  }
  return false;
}

export async function changePlayerPassword({
  playerId,
  playerName,
  currentPassword,
  newPassword,
}: {
  playerId?: string;
  playerName?: string;
  currentPassword?: string;
  newPassword: string;
}): Promise<{ success: boolean; message: string }> {
  if (newPassword.length < 4) {
    throw new Error("New password must be at least 4 characters");
  }

  // Find player record in Supabase or local accounts
  let targetPlayer: {
    id: string;
    name: string;
    quote: string | null;
    spirit_animal: string;
  } | null = null;

  try {
    if (playerId) {
      const { data } = await supabase.from("players").select("*").eq("id", playerId).single();
      if (data) targetPlayer = data;
    }
    if (!targetPlayer && playerName) {
      const { data } = await supabase.from("players").select("*").ilike("name", playerName.trim());
      if (data && data.length > 0) targetPlayer = data[0];
    }
  } catch (e) {
    console.debug("Supabase lookup error during password change:", e);
  }

  // Also check local account cache
  const localAccounts = getLocalAccounts();
  const localMatch = localAccounts.find(
    (a) =>
      (playerId && a.id === playerId) ||
      (playerName && a.name.toLowerCase() === playerName.trim().toLowerCase()),
  );

  const rawQuote = targetPlayer?.quote || localMatch?.quote || "";
  const parsed = parseQuoteAuth(rawQuote);

  // If player already has a password, verify current password
  const existingSalt = parsed.auth?.salt || localMatch?.salt;
  const existingHash = parsed.auth?.hash || localMatch?.passwordHash;

  if (existingSalt && existingHash) {
    if (!currentPassword) {
      throw new Error("Please enter your current password to authorize this change");
    }
    const computedCurrent = await hashPassword(currentPassword, existingSalt);
    if (computedCurrent !== existingHash) {
      throw new Error("Current password is incorrect");
    }
    if (currentPassword === newPassword) {
      throw new Error("New password must be different from current password");
    }
  }

  // Hash the new password
  const newSalt = generateSalt();
  const newHash = await hashPassword(newPassword, newSalt);
  const clean = parsed.clean || cleanQuote(rawQuote) || "Game night ready";
  const updatedQuote = encodeQuoteAuth(clean, newSalt, newHash);

  const effectiveId = targetPlayer?.id || localMatch?.id || playerId || crypto.randomUUID();
  const effectiveName = targetPlayer?.name || localMatch?.name || playerName || "Player";
  const effectiveAnimal = targetPlayer?.spirit_animal || localMatch?.spirit_animal || "fox";

  // Update in Supabase
  try {
    if (targetPlayer?.id) {
      await supabase.from("players").update({ quote: updatedQuote }).eq("id", targetPlayer.id);
    }
  } catch (e) {
    console.debug("Supabase update error during password change:", e);
  }

  // Update in local accounts cache
  saveLocalAccount({
    id: effectiveId,
    name: effectiveName,
    spirit_animal: effectiveAnimal,
    quote: clean,
    salt: newSalt,
    passwordHash: newHash,
    createdAt: new Date().toISOString(),
  });

  // If the player whose password was changed is currently logged in, update session
  const currentUser = getCurrentUser();
  if (
    currentUser &&
    (currentUser.id === effectiveId ||
      currentUser.name.toLowerCase() === effectiveName.toLowerCase())
  ) {
    setCurrentUser({
      ...currentUser,
      id: effectiveId,
      name: effectiveName,
      spirit_animal: effectiveAnimal,
      quote: clean,
    });
  }

  return { success: true, message: "Password updated successfully!" };
}
