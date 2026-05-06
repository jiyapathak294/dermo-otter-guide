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
  goalCheckins?: Record<string, string[]>; // goal name -> ISO date strings (yyyy-mm-dd)
  [k: string]: any;
};

const KEY = "dermo.profile.v1";

export const saveProfile = (p: UserProfile) => {
  const existing = loadProfile() || {};
  const merged = { ...existing, ...p };
  // Normalize personalInfo
  if (p.firstName || p.dob || p.gender) {
    merged.personalInfo = {
      ...(existing.personalInfo || {}),
      firstName: p.firstName ?? existing.personalInfo?.firstName,
      dob: p.dob ?? existing.personalInfo?.dob,
      gender: p.gender ?? existing.personalInfo?.gender,
    };
  }
  localStorage.setItem(KEY, JSON.stringify(merged));
};

export const loadProfile = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
};

export const clearProfile = () => localStorage.removeItem(KEY);

export const updateProfile = (patch: Partial<UserProfile>) => {
  const p = loadProfile() || {};
  const next = { ...p, ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  return next;
};

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
