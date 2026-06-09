import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth";
import { DermoLogo } from "@/components/DermoLogo";

const ForgotPassword = () => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsed = z.string().trim().email().safeParse(email);
    if (!parsed.success) return setError("Enter a valid email.");
    setBusy(true);
    const { error } = await resetPassword(email);
    setBusy(false);
    if (error) { setError(error); return; }
    setSent(true);
  };

  return (
    <main className="app-frame min-h-screen flex flex-col items-center justify-center px-6 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <DermoLogo color="#8d77ab" size={64} />
          <h1 className="font-heading text-2xl mt-4">Reset your password</h1>
        </div>
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          {sent ? (
            <div className="text-sm text-foreground/80">
              If an account exists for <strong>{email}</strong>, we sent a reset link. Check your inbox.
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {error && <div className="text-sm text-destructive bg-destructive/10 rounded-md px-3 py-2">{error}</div>}
              <Button type="submit" disabled={busy} className="w-full bg-[hsl(var(--lavender))] hover:bg-[hsl(var(--lavender))]/90 text-white">
                {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send reset link"}
              </Button>
            </form>
          )}
          <div className="text-center mt-4">
            <Link to="/auth" className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">Back to sign in</Link>
          </div>
        </div>
      </div>
    </main>
  );
};

export default ForgotPassword;
