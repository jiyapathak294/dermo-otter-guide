import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { setAuthUserId, syncProfileFromDB, pushProfileToDB, clearProfile } from "@/lib/profile";

type AuthState = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  onboardingCompleted: boolean;
  refreshProfile: () => Promise<void>;
  signUp: (email: string, password: string, firstName?: string) => Promise<{ error?: string }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error?: string }>;
};

const Ctx = createContext<AuthState | undefined>(undefined);

const friendly = (msg?: string) => {
  if (!msg) return "Something went wrong. Please try again.";
  const m = msg.toLowerCase();
  if (m.includes("invalid login")) return "Incorrect email or password.";
  if (m.includes("already registered") || m.includes("user already")) return "An account with this email already exists.";
  if (m.includes("email not confirmed")) return "Incorrect email or password.";
  if (m.includes("password") && m.includes("pwned")) return "This password has appeared in a data breach. Please choose a different one.";
  if (m.includes("network")) return "Network error. Please check your connection.";
  return msg;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);

  const loadProfileFor = async (uid: string) => {
    setAuthUserId(uid);
    const p = await syncProfileFromDB(uid);
    setOnboardingCompleted(!!p?.onboardingCompleted);
  };

  useEffect(() => {
    // Listen first so we never miss an event
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        // Defer DB call to avoid deadlocks
        setTimeout(() => { loadProfileFor(sess.user.id); }, 0);
      } else {
        setAuthUserId(null);
        setOnboardingCompleted(false);
      }
    });

    // Then fetch existing session
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        loadProfileFor(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const refreshProfile = async () => {
    if (user) {
      const p = await syncProfileFromDB(user.id);
      setOnboardingCompleted(!!p?.onboardingCompleted);
    }
  };

  const signUp: AuthState["signUp"] = async (email, password, firstName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: firstName ? { first_name: firstName } : undefined },
    });
    if (error) return { error: friendly(error.message) };
    // If signUp returned a session we're already logged in
    if (data.session) return {};
    // No session = email confirmation still required; try signing in anyway
    const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password });
    if (signInErr) {
      return { error: "Account created — but email confirmation is still ON in Supabase. Go to Supabase → Authentication → Providers → Email → disable 'Confirm email'." };
    }
    return {};
  };

  const signIn: AuthState["signIn"] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: friendly(error.message) };
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    clearProfile();
    setAuthUserId(null);
    setOnboardingCompleted(false);
  };

  const resetPassword: AuthState["resetPassword"] = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: friendly(error.message) };
    return {};
  };

  return (
    <Ctx.Provider value={{ user, session, loading, onboardingCompleted, refreshProfile, signUp, signIn, signOut, resetPassword }}>
      {children}
    </Ctx.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

export { pushProfileToDB };
