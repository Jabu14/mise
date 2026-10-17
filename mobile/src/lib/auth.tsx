// Accounts: sign in, create an account, sign out, reset a password.
//
// Two backends behind the same functions, so screens never change when the real database arrives:
// - Supabase (free online database with built-in accounts) when EXPO_PUBLIC_SUPABASE_URL and
//   EXPO_PUBLIC_SUPABASE_ANON_KEY are set in mobile/.env.local. Talks to its Auth REST API directly.
// - Demo mode otherwise: accounts are kept on this phone only (passwords salted and hashed), so the
//   whole flow can be tried before any database exists.
// The signed-in session is kept in the phone's secure storage (Keychain on iPhone).
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

export type User = { id: string; email: string; name: string; createdAt: number };
export type AuthMode = 'supabase' | 'demo';

const SUPABASE_URL = (process.env.EXPO_PUBLIC_SUPABASE_URL ?? '').trim().replace(/\/+$/, '');
const SUPABASE_KEY = (process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '').trim();
export const AUTH_MODE: AuthMode = /^https:\/\//.test(SUPABASE_URL) && SUPABASE_KEY ? 'supabase' : 'demo';

const SESSION_KEY = 'mise.session.v1';
const ACCOUNTS_KEY = 'mise.accounts.v1';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export class AuthError extends Error {}

// Secure storage on the phone; the web preview has none, so it falls back to local storage there.
const vault = {
  get: (k: string) => (Platform.OS === 'web' ? AsyncStorage.getItem(k) : SecureStore.getItemAsync(k)),
  set: (k: string, v: string) => (Platform.OS === 'web' ? AsyncStorage.setItem(k, v) : SecureStore.setItemAsync(k, v)),
  del: (k: string) => (Platform.OS === 'web' ? AsyncStorage.removeItem(k) : SecureStore.deleteItemAsync(k)),
};

export function checkEmail(email: string) {
  if (!EMAIL_RE.test(email.trim())) throw new AuthError('Enter a valid email address.');
  return email.trim().toLowerCase();
}
export function checkPassword(pw: string) {
  if (pw.length < 8) throw new AuthError('Use at least 8 characters for your password.');
  if (pw.length > 72) throw new AuthError('That password is too long (72 characters at most).');
  return pw;
}

// ---------- demo backend (this phone only) ----------
type DemoAccount = User & { salt: string; hash: string };

async function hashPassword(password: string, salt: string) {
  let h = `${salt}:${password}`;
  for (let i = 0; i < 64; i++) h = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, `${salt}${h}`);
  return h;
}
async function readAccounts(): Promise<DemoAccount[]> {
  try {
    const list = JSON.parse((await AsyncStorage.getItem(ACCOUNTS_KEY)) || '[]');
    return Array.isArray(list) ? list.filter(a => a && typeof a.email === 'string' && typeof a.hash === 'string' && typeof a.salt === 'string').slice(0, 20) : [];
  } catch {
    return [];
  }
}
const toHex = (b: Uint8Array) => Array.from(b, x => x.toString(16).padStart(2, '0')).join('');
const publicUser = (a: DemoAccount): User => ({ id: a.id, email: a.email, name: a.name, createdAt: a.createdAt });

const demo = {
  async signUp(name: string, email: string, password: string): Promise<User> {
    const accounts = await readAccounts();
    if (accounts.some(a => a.email === email)) throw new AuthError('There’s already an account with that email. Sign in instead.');
    const salt = toHex(Crypto.getRandomBytes(16));
    const account: DemoAccount = { id: Crypto.randomUUID(), email, name: name.trim().slice(0, 40), createdAt: Date.now(), salt, hash: await hashPassword(password, salt) };
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify([...accounts, account]));
    return publicUser(account);
  },
  async signIn(email: string, password: string): Promise<User> {
    const account = (await readAccounts()).find(a => a.email === email);
    // Same message either way, so it doesn't reveal which emails have accounts.
    if (!account || (await hashPassword(password, account.salt)) !== account.hash) throw new AuthError('That email and password don’t match.');
    return publicUser(account);
  },
  async remove(id: string) {
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify((await readAccounts()).filter(a => a.id !== id)));
  },
  async rename(id: string, name: string) {
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify((await readAccounts()).map(a => (a.id === id ? { ...a, name: name.trim().slice(0, 40) } : a))));
  },
};

// ---------- Supabase backend ----------
type SupaSession = { access_token: string; refresh_token: string; expires_at: number; user: User };

async function supa(path: string, body: object, token?: string) {
  let res: Response;
  try {
    res = await fetch(`${SUPABASE_URL}/auth/v1/${path}`, {
      method: 'POST',
      headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AuthError('No connection. Check your internet and try again.');
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const msg = String(data.msg || data.error_description || data.message || '');
    if (/invalid login/i.test(msg)) throw new AuthError('That email and password don’t match.');
    if (/already registered|already exists/i.test(msg)) throw new AuthError('There’s already an account with that email. Sign in instead.');
    if (/not confirmed/i.test(msg)) throw new AuthError('Confirm your email first: open the link we sent you, then sign in.');
    throw new AuthError(msg ? msg.slice(0, 160) : 'Something went wrong. Try again in a moment.');
  }
  return data;
}
function readSupaUser(u: unknown): User {
  const o = (u && typeof u === 'object' ? u : {}) as Record<string, unknown>;
  const meta = (o.user_metadata && typeof o.user_metadata === 'object' ? o.user_metadata : {}) as Record<string, unknown>;
  return { id: String(o.id ?? ''), email: String(o.email ?? ''), name: typeof meta.name === 'string' ? meta.name.slice(0, 40) : '', createdAt: Date.parse(String(o.created_at ?? '')) || Date.now() };
}
function readSupaSession(d: Record<string, unknown>): SupaSession | null {
  if (typeof d.access_token !== 'string' || typeof d.refresh_token !== 'string') return null;
  return { access_token: d.access_token, refresh_token: d.refresh_token, expires_at: Date.now() + (Number(d.expires_in) || 3600) * 1000, user: readSupaUser(d.user) };
}

// ---------- the hook ----------
type Stored = { mode: 'demo'; user: User } | ({ mode: 'supabase' } & SupaSession);

type AuthValue = {
  ready: boolean;
  user: User | null;
  mode: AuthMode;
  signIn: (email: string, password: string) => Promise<void>;
  // Returns 'confirm' when the account was made but the email has to be confirmed first.
  signUp: (name: string, email: string, password: string) => Promise<'ok' | 'confirm'>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  setName: (name: string) => Promise<void>;
};

const Ctx = createContext<AuthValue | null>(null);
export const useAuth = () => useContext(Ctx)!;

export function AuthProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<Stored | null>(null);
  const [ready, setReady] = useState(false);

  const save = useCallback(async (s: Stored | null) => {
    setStored(s);
    if (s) await vault.set(SESSION_KEY, JSON.stringify(s)).catch(() => {});
    else await vault.del(SESSION_KEY).catch(() => {});
  }, []);

  // Restore the session; refresh an online one that has expired.
  useEffect(() => {
    (async () => {
      try {
        const raw = await vault.get(SESSION_KEY);
        const s = raw ? (JSON.parse(raw) as Stored) : null;
        if (!s || s.mode !== AUTH_MODE || !s.user?.id) { if (s) await vault.del(SESSION_KEY); return; }
        if (s.mode === 'supabase' && s.expires_at < Date.now() + 60_000) {
          const fresh = readSupaSession(await supa('token?grant_type=refresh_token', { refresh_token: s.refresh_token }));
          await save(fresh ? { mode: 'supabase', ...fresh } : null);
          return;
        }
        setStored(s);
      } catch {
        // Offline or the refresh failed: keep the saved account so the app still works.
        const raw = await vault.get(SESSION_KEY).catch(() => null);
        try { if (raw) setStored(JSON.parse(raw)); } catch { /* unreadable */ }
      } finally {
        setReady(true);
      }
    })();
  }, [save]);

  const signIn = useCallback(async (emailIn: string, password: string) => {
    const email = checkEmail(emailIn);
    if (!password) throw new AuthError('Enter your password.');
    if (AUTH_MODE === 'demo') return save({ mode: 'demo', user: await demo.signIn(email, password) });
    const s = readSupaSession(await supa('token?grant_type=password', { email, password }));
    if (!s) throw new AuthError('Couldn’t sign in. Try again.');
    await save({ mode: 'supabase', ...s });
  }, [save]);

  const signUp = useCallback(async (name: string, emailIn: string, passwordIn: string) => {
    const email = checkEmail(emailIn);
    const password = checkPassword(passwordIn);
    if (!name.trim()) throw new AuthError('Add your name.');
    if (AUTH_MODE === 'demo') { await save({ mode: 'demo', user: await demo.signUp(name, email, password) }); return 'ok' as const; }
    const data = await supa('signup', { email, password, data: { name: name.trim().slice(0, 40) } });
    const s = readSupaSession(data);
    if (!s) return 'confirm' as const; // the project asks people to confirm their email
    await save({ mode: 'supabase', ...s });
    return 'ok' as const;
  }, [save]);

  const signOut = useCallback(async () => {
    if (stored?.mode === 'supabase') await supa('logout', {}, stored.access_token).catch(() => {});
    await save(null);
  }, [stored, save]);

  const resetPassword = useCallback(async (emailIn: string) => {
    const email = checkEmail(emailIn);
    if (AUTH_MODE === 'demo') throw new AuthError('In demo mode accounts live on this phone, so there’s no email to send. Create a new account instead.');
    await supa('recover', { email });
  }, []);

  const deleteAccount = useCallback(async () => {
    if (!stored) return;
    if (stored.mode === 'supabase') throw new AuthError('To delete an online account, contact support from Help & legal. We’ll remove it and everything in it.');
    await demo.remove(stored.user.id);
    await save(null);
  }, [stored, save]);

  const setName = useCallback(async (name: string) => {
    if (!stored) return;
    const clean = name.trim().slice(0, 40);
    if (stored.mode === 'demo') await demo.rename(stored.user.id, clean);
    else {
      const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, { method: 'PUT', headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${stored.access_token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ data: { name: clean } }) }).catch(() => null);
      if (!res?.ok) return;
    }
    await save({ ...stored, user: { ...stored.user, name: clean } });
  }, [stored, save]);

  const value = useMemo<AuthValue>(() => ({
    ready, user: stored?.user ?? null, mode: AUTH_MODE, signIn, signUp, signOut, resetPassword, deleteAccount, setName,
  }), [ready, stored, signIn, signUp, signOut, resetPassword, deleteAccount, setName]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
