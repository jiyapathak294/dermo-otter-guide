import { supabase } from "@/integrations/supabase/client";

export type Product = {
  id: string;
  name: string;
  brand?: string;
  image?: string;
  category?: string;
  ingredients?: string[];
  price?: string;
  retailer?: string;
  url?: string;
};

export type RoutineSlot = {
  step: string;
  product_type: string;
  ingredient: string;
  why: string;
  product?: Product | null;
};

export type UserProfile = {
  personalInfo?: { firstName?: string; dob?: string; gender?: string };
  focus?: string[];
  conditions?: string[];
  lifeStage?: string;
  sensitivities?: string[];
  allergies?: string[];
  skinType?: string;
  skinConcerns?: string[];
  skinGoals?: string[];
  hairGoals?: string[];
  nailGoals?: string[];
  routines?: any;
  selectedProducts?: Record<string, Product>;
  buyList?: Product[];
  chatHistory?: { role: string; content: string }[];
  progressLogs?: { date: string; note: string }[];
  goalCheckins?: Record<string, string[]>;
  onboardingCompleted?: boolean;
  [k: string]: any;
};

const KEY = "dermo.profile.v1";

// --- Auth binding ---
let currentUserId: string | null = null;
export const setAuthUserId = (id: string | null) => {
  currentUserId = id;
  if (!id) localStorage.removeItem(KEY);
};
export const getAuthUserId = () => currentUserId;

// --- Local cache ---
export const loadProfile = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const clearProfile = () => localStorage.removeItem(KEY);

const writeLocal = (p: UserProfile) => localStorage.setItem(KEY, JSON.stringify(p));

// --- DB sync ---
export const syncProfileFromDB = async (userId: string): Promise<UserProfile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select("extra, onboarding_completed, first_name, dob, gender, email")
    .eq("id", userId)
    .maybeSingle();
  if (error || !data) return null;
  const extra = (data.extra as Record<string, any>) || {};
  const profile: UserProfile = { ...extra };
  profile.onboardingCompleted = !!data.onboarding_completed;
  if (data.first_name || data.dob || data.gender) {
    profile.personalInfo = {
      firstName: data.first_name ?? profile.personalInfo?.firstName,
      dob: data.dob ?? profile.personalInfo?.dob,
      gender: data.gender ?? profile.personalInfo?.gender,
    };
  }
  writeLocal(profile);
  return profile;
};

export const pushProfileToDB = async (userId: string) => {
  const p = loadProfile() || {};
  await supabase.from("profiles").upsert({
    id: userId,
    extra: p as any,
    first_name: p.personalInfo?.firstName ?? null,
    dob: p.personalInfo?.dob ?? null,
    gender: p.personalInfo?.gender ?? null,
    onboarding_completed: !!p.onboardingCompleted,
  });
};

const schedulePush = () => {
  if (!currentUserId) return;
  const uid = currentUserId;
  // fire-and-forget; queued microtask so multiple updates in one tick coalesce
  queueMicrotask(() => { pushProfileToDB(uid).catch(() => {}); });
};

// --- Public mutators (kept sync to preserve existing call sites) ---
export const saveProfile = (p: UserProfile) => {
  const existing = loadProfile() || {};
  const merged: UserProfile = { ...existing, ...p };
  if ((p as any).firstName || (p as any).dob || (p as any).gender) {
    merged.personalInfo = {
      ...(existing.personalInfo || {}),
      firstName: (p as any).firstName ?? existing.personalInfo?.firstName,
      dob: (p as any).dob ?? existing.personalInfo?.dob,
      gender: (p as any).gender ?? existing.personalInfo?.gender,
    };
  }
  writeLocal(merged);
  schedulePush();
};

export const updateProfile = (patch: Partial<UserProfile>) => {
  const p = loadProfile() || {};
  const next = { ...p, ...patch };
  writeLocal(next);
  schedulePush();
  return next;
};

export const markOnboardingComplete = () => {
  updateProfile({ onboardingCompleted: true });
};

// --- Helpers (unchanged behavior) ---
export const allGoals = (p?: UserProfile | null): string[] => {
  if (!p) return [];
  return [
    ...(p.skinGoals || []),
    ...(p.hairGoals || []),
    ...(p.nailGoals || []),
  ];
};

export const addToBuyList = (prod: Product) => {
  const p = loadProfile() || {};
  const list = p.buyList || [];
  if (!list.find((x) => x.id === prod.id)) list.push(prod);
  return updateProfile({ buyList: list });
};

export const removeFromBuyList = (id: string) => {
  const p = loadProfile() || {};
  const list = (p.buyList || []).filter((x) => x.id !== id);
  return updateProfile({ buyList: list });
};

export const setSelectedProduct = (slotKey: string, prod: Product) => {
  const p = loadProfile() || {};
  const sel = { ...(p.selectedProducts || {}) };
  sel[slotKey] = prod;
  return updateProfile({ selectedProducts: sel });
};

const todayISO = () => new Date().toISOString().slice(0, 10);

export const checkInGoal = (goal: string) => {
  const p = loadProfile() || {};
  const map = { ...(p.goalCheckins || {}) };
  const arr = new Set(map[goal] || []);
  arr.add(todayISO());
  map[goal] = Array.from(arr).sort();
  return updateProfile({ goalCheckins: map });
};

export const uncheckGoalToday = (goal: string) => {
  const p = loadProfile() || {};
  const map = { ...(p.goalCheckins || {}) };
  map[goal] = (map[goal] || []).filter((d) => d !== todayISO());
  return updateProfile({ goalCheckins: map });
};

export const goalStreak = (goal: string, p?: UserProfile | null): number => {
  const dates = new Set((p?.goalCheckins?.[goal]) || []);
  let streak = 0;
  const d = new Date();
  while (dates.has(d.toISOString().slice(0, 10))) { streak++; d.setDate(d.getDate() - 1); }
  return streak;
};

export const goalPercent = (goal: string, p?: UserProfile | null, days = 7): number => {
  const dates = new Set((p?.goalCheckins?.[goal]) || []);
  let hit = 0;
  const d = new Date();
  for (let i = 0; i < days; i++) {
    if (dates.has(d.toISOString().slice(0, 10))) hit++;
    d.setDate(d.getDate() - 1);
  }
  return Math.round((hit / days) * 100);
};

export const checkedToday = (goal: string, p?: UserProfile | null): boolean =>
  ((p?.goalCheckins?.[goal]) || []).includes(todayISO());

export const removeGoal = (goal: string) => {
  const p = loadProfile() || {};
  const filt = (arr?: string[]) => (arr || []).filter((g) => g !== goal);
  return updateProfile({
    skinGoals: filt(p.skinGoals),
    hairGoals: filt(p.hairGoals),
    nailGoals: filt(p.nailGoals),
  });
};

// ---- Weekly login streak ("weeks in a row you opened Dermo") ----
// Stored as ISO year-week strings, e.g. "2026-W27".
const isoWeek = (d: Date): string => {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((t.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

export const recordWeeklyVisit = () => {
  const p = loadProfile() || {};
  const weeks = new Set<string>((p as any).weeklyVisits || []);
  weeks.add(isoWeek(new Date()));
  return updateProfile({ weeklyVisits: Array.from(weeks).sort() } as any);
};

export const weeklyStreak = (p?: UserProfile | null): number => {
  const weeks = new Set<string>(((p as any)?.weeklyVisits) || []);
  if (weeks.size === 0) return 0;
  let streak = 0;
  const d = new Date();
  while (weeks.has(isoWeek(d))) {
    streak++;
    d.setDate(d.getDate() - 7);
  }
  return streak;
};

export const lastWeeksVisited = (n = 8, p?: UserProfile | null): { key: string; visited: boolean }[] => {
  const weeks = new Set<string>(((p as any)?.weeklyVisits) || []);
  const out: { key: string; visited: boolean }[] = [];
  const d = new Date();
  for (let i = 0; i < n; i++) {
    const k = isoWeek(d);
    out.unshift({ key: k, visited: weeks.has(k) });
    d.setDate(d.getDate() - 7);
  }
  return out;
};

