import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { DermoLogo } from "@/components/DermoLogo";
import { toast } from "sonner";

const passwordSchema = z.string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "One uppercase letter")
  .regex(/[0-9]/, "One number")
  .regex(/[^A-Za-z0-9]/, "One special character");

const ResetPassword = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash automatically
    // and emits a PASSWORD_RECOVERY event.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    supabase.auth.getSession().then(({ data }) => { if (data.session) setReady(true); });
    return () => { sub.subscription.unsubscribe(); };
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    if (password !== confirm) return setError("Passwords do not match.");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setError(error.message); return; }
    toast.success("Password updated.");
    navigate("/", { replace: true });
  };

  return (
    <main className="app-frame min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <DermoLogo color="#8d77ab" size={64} />
          <h1 className="font-heading text-2xl mt-4">Set a new password</h1>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          {!ready ? (
            <div className="text-sm text-muted-foreground text-center py-6">
              Validating reset link…
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="password">New password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                <p className="text-[11px] text-muted-foreground">8+ chars, 1 uppercase, 1 number, 1 special character.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirm">Confirm password</Label>
                <Input id="confirm" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</div>}
              <Button type="submit" disabled={busy} className="w-full bg-[hsl(var(--lavender))] hover:bg-[hsl(var(--lavender))]/90 text-white">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
};

export default ResetPassword;
