export type UserProfile = Record<string, any>;

const KEY = "dermasense.profile.v1";

export const saveProfile = (p: UserProfile) => {
  localStorage.setItem(KEY, JSON.stringify(p));
};

export const loadProfile = (): UserProfile | null => {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const clearProfile = () => localStorage.removeItem(KEY);

export const updateGoals = (goals: string[]) => {
  const p = loadProfile() || {};
  p.goals = goals;
  saveProfile(p);
};
