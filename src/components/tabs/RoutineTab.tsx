import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile } from "@/lib/profile";
import { Sparkles, Sun, Moon, AlertTriangle, Loader2 } from "lucide-react";

type Step = { step: string; product_type: string; ingredient: string; why: string };
type Routine = {
  skin?: { morning?: Step[]; night?: Step[] };
  hair?: { weekly?: Step[] };
  nails?: { daily?: Step[] };
  warnings?: string[];
};

const StepCard = ({ s, n }: { s: Step; n: number }) => (
  <div className="rounded-2xl bg-white border border-border p-4 shadow-soft">
    <div className="flex items-center gap-3">
      <div className="h-8 w-8 rounded-full bg-baby-blue text-navy font-heading flex items-center justify-center text-sm">{n}</div>
      <div className="flex-1">
        <p className="font-heading text-navy text-base leading-tight">{s.step}</p>
        <p className="text-xs text-muted-foreground">{s.product_type} · {s.ingredient}</p>
      </div>
    </div>
    <p className="text-sm text-foreground mt-2">{s.why}</p>
  </div>
);

const Section = ({ title, Icon, steps }: { title: string; Icon: any; steps?: Step[] }) =>
  steps && steps.length > 0 ? (
    <div className="space-y-3">
      <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-navy" /><h3 className="font-heading text-navy text-lg">{title}</h3></div>
      {steps.map((s, i) => <StepCard key={i} s={s} n={i + 1} />)}
    </div>
  ) : null;

export const RoutineTab = () => {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    setLoading(true); setError(null);
    const profile = loadProfile();
    if (!profile) { setLoading(false); setError("No profile found. Please complete the survey."); return; }
    try {
      const { data, error } = await supabase.functions.invoke("routine-generator", { body: { profile } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRoutine(data.routine);
      localStorage.setItem("dermasense.routine.v1", JSON.stringify(data.routine));
    } catch (e: any) { setError(e.message || "Failed to generate."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const cached = localStorage.getItem("dermasense.routine.v1");
    if (cached) { setRoutine(JSON.parse(cached)); setLoading(false); }
    else generate();
  }, []);

  return (
    <div className="px-5 pt-6 pb-6 space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl text-navy">Your Routine</h2>
        <button onClick={generate} className="text-xs font-semibold px-3 py-2 rounded-full bg-baby-blue text-navy">Regenerate</button>
      </div>

      {loading && (
        <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-navy" />
          <p className="text-sm">Derma is crafting your routine…</p>
        </div>
      )}

      {error && <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">{error}</div>}

      {routine?.warnings && routine.warnings.length > 0 && (
        <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-900 flex gap-2">
          <AlertTriangle className="h-5 w-5 flex-none" />
          <ul className="space-y-1 list-disc pl-4">{routine.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}

      <Section title="Morning · Skin" Icon={Sun} steps={routine?.skin?.morning} />
      <Section title="Night · Skin" Icon={Moon} steps={routine?.skin?.night} />
      <Section title="Weekly · Hair" Icon={Sparkles} steps={routine?.hair?.weekly} />
      <Section title="Daily · Nails" Icon={Sparkles} steps={routine?.nails?.daily} />

      <p className="text-[11px] text-center text-muted-foreground pt-4">DermaSense AI does not replace professional medical care.</p>
    </div>
  );
};
