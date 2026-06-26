import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { z } from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { lovable } from "@/integrations/lovable";
import { supabase } from "@/integrations/supabase/client";
import { DermoLogo } from "@/components/DermoLogo";
import googleAsset from "@/assets/google.avif.asset.json";

type Mode = "signin" | "signup";

const passwordSchema = z.string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "One uppercase letter")
  .regex(/[0-9]/, "One number")
  .regex(/[^A-Za-z0-9]/, "One special character");

const emailSchema = z.string().trim().email("Enter a valid email").max(255);

const Auth = () => {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [firstName, setFirstName] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const emailRes = emailSchema.safeParse(email);
    if (!emailRes.success) return setError(emailRes.error.issues[0].message);

    if (mode === "signup") {
      const pwRes = passwordSchema.safeParse(password);
      if (!pwRes.success) return setError(pwRes.error.issues[0].message);
      if (password !== confirm) return setError("Passwords do not match.");
      if (!firstName.trim()) return setError("Please enter your first name.");
    }

    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await signUp(email, password, firstName.trim());
        if (error) { setError(error); return; }
        setEmailSent(true);
      } else {
        const { error } = await signIn(email, password);
        if (error) { setError(error); return; }
        navigate("/", { replace: true });
      }
    } finally {
      setBusy(false);
    }
  };

  const oauth = async (provider: "google") => {
    setBusy(true);
    setError(null);
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setError(result.error.message || "Could not sign in.");
      setBusy(false);
      return;
    }
    if (result.redirected) return;
    navigate("/", { replace: true });
  };

  const oauthFacebook = async () => {
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "facebook",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setError(error.message || "Could not sign in with Facebook.");
      setBusy(false);
    }
  };

  if (emailSent) {
    return (
      <main className="app-frame min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-gradient-to-b from-background to-[hsl(var(--lavender)/0.15)]">
        <div className="w-full max-w-sm text-center">
          <DermoLogo color="#8d77ab" size={72} />
          <h1 className="font-heading text-2xl mt-6 text-foreground">Check your email</h1>
          <p className="text-sm text-muted-foreground mt-2">
            We sent a confirmation link to <span className="font-medium text-foreground">{email}</span>. Click the link to activate your account and get started.
          </p>
          <button
            type="button"
            onClick={() => { setEmailSent(false); setMode("signin"); }}
            className="mt-6 text-sm text-[hsl(var(--lavender))] hover:underline"
          >
            Back to sign in
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="app-frame min-h-screen flex flex-col items-center justify-center px-6 py-10 bg-gradient-to-b from-background to-[hsl(var(--lavender)/0.15)]">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <DermoLogo color="#8d77ab" size={72} />
          <h1 className="font-heading text-3xl mt-4 text-foreground">Welcome to Dermo</h1>
          <p className="text-sm text-muted-foreground mt-1 text-center">
            {mode === "signin" ? "Sign in to continue your routine." : "Create an account to get started."}
          </p>
        </div>

        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="flex rounded-lg bg-muted p-1 mb-6 text-sm">
            <button
              type="button"
              onClick={() => { setMode("signin"); setError(null); }}
              className={`flex-1 py-2 rounded-md transition-all ${mode === "signin" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
            >Sign in</button>
            <button
              type="button"
              onClick={() => { setMode("signup"); setError(null); }}
              className={`flex-1 py-2 rounded-md transition-all ${mode === "signup" ? "bg-background shadow-sm font-medium" : "text-muted-foreground"}`}
            >Create account</button>
          </div>

          <form onSubmit={submit} className="space-y-4">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  required
                />
                <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground" aria-label="Toggle password">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {mode === "signup" && (
                <p className="text-[11px] text-muted-foreground mt-1">8+ chars, 1 uppercase, 1 number, 1 special character.</p>
              )}
            </div>
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type={showPw ? "text" : "password"} value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" required />
              </div>
            )}

            {error && (
              <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</div>
            )}

            <Button type="submit" disabled={busy} className="w-full bg-[hsl(var(--lavender))] hover:bg-[hsl(var(--lavender))]/90 text-white">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : (mode === "signin" ? "Sign in" : "Create account")}
            </Button>

            {mode === "signin" && (
              <div className="text-center">
                <Link to="/forgot-password" className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                  Forgot password?
                </Link>
              </div>
            )}
          </form>

          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[11px] uppercase tracking-wider text-muted-foreground">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <div className="space-y-2">
            <Button type="button" variant="outline" className="w-full gap-2" onClick={() => oauth("google")} disabled={busy}>
              <img src={googleAsset.url} alt="" className="w-4 h-4" />
              Continue with Google
            </Button>
            <Button type="button" variant="outline" className="w-full gap-2 bg-[#1877F2] text-white border-[#1877F2] hover:bg-[#1877F2]/90 hover:text-white" onClick={oauthFacebook} disabled={busy}>
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              Continue with Facebook
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground text-center mt-6 px-4">
          By continuing, you agree to our Terms and Privacy Policy. Dermo provides general guidance, not medical advice.
        </p>
      </div>
    </main>
  );
};

export default Auth;
