import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile } from "@/lib/profile";
import { Sparkles, Sun, Moon, AlertTriangle, Loader2, ChevronDown, Search } from "lucide-react";
import { CautionModal } from "@/components/CautionModal";

type Step = { step: string; product_type: string; ingredient: string; why: string };
type Routine = {
  skin?: { morning?: Step[]; night?: Step[] };
  hair?: { weekly?: Step[] };
  nails?: { daily?: Step[] };
  warnings?: string[];
};

const StepCard = ({ s, n, onFind }: { s: Step; n: number; onFind: (q: string) => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl bg-white border border-border p-4 shadow-soft">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-baby-blue text-white font-heading flex items-center justify-center text-sm">{n}</div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-navy text-base leading-tight truncate">{s.step}</p>
          <p className="text-xs text-muted-foreground truncate">{s.product_type} · {s.ingredient}</p>
        </div>
        <div className="h-14 w-14 rounded-xl bg-spa-mist flex items-center justify-center text-[10px] text-muted-foreground text-center px-1">
          Choose<br/>Product
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => setOpen(!open)} className="flex-1 rounded-full bg-baby-blue text-white text-xs font-semibold py-2 active:scale-95 flex items-center justify-center gap-1">
          Why? <ChevronDown className={`h-3 w-3 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <button onClick={() => onFind(`${s.product_type} with ${s.ingredient}`)} className="flex-1 rounded-full bg-navy text-white text-xs font-semibold py-2 active:scale-95 flex items-center justify-center gap-1">
          <Search className="h-3 w-3" /> Find Products
        </button>
      </div>
      {open && (
        <div className="mt-3 rounded-xl bg-spa-mist p-3 animate-fade-in">
          <p className="text-xs font-heading text-navy mb-1">Why this step</p>
          <p className="text-sm text-foreground">{s.why}</p>
        </div>
      )}
    </div>
  );
};

const Section = ({ title, Icon, steps, onFind }: { title: string; Icon: any; steps?: Step[]; onFind: (q: string) => void }) =>
  steps && steps.length > 0 ? (
    <div className="space-y-3">
      <div className="flex items-center gap-2"><Icon className="h-5 w-5 text-navy" /><h3 className="font-heading text-navy text-lg">{title}</h3></div>
      {steps.map((s, i) => <StepCard key={i} s={s} n={i + 1} onFind={onFind} />)}
    </div>
  ) : null;

export const RoutineTab = ({ onFindProducts }: { onFindProducts?: (q: string) => void }) => {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCaution, setShowCaution] = useState(false);
  const profile = loadProfile();
  const focus = profile?.focus || [];

  const generate = async () => {
    setLoading(true); setError(null);
    if (!profile) { setLoading(false); setError("No profile found. Please complete the survey."); return; }
    try {
      const { data, error } = await supabase.functions.invoke("routine-generator", { body: { profile } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setRoutine(data.routine);
      localStorage.setItem("dermo.routine.v1", JSON.stringify(data.routine));
    } catch (e: any) { setError(e.message || "Failed to generate."); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const cached = localStorage.getItem("dermo.routine.v1");
    if (cached) { setRoutine(JSON.parse(cached)); setLoading(false); }
    else generate();
  }, []);

  const onFind = (q: string) => onFindProducts?.(q);

  return (
    <div className="px-5 pt-6 pb-6 space-y-5 relative">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl text-navy">Your Routine</h2>
        <button onClick={() => setShowCaution(true)} className="flex items-center gap-1.5 rounded-full bg-yellow-50 border border-yellow-200 px-3 py-1.5 text-xs font-semibold text-yellow-800 active:scale-95">
          <AlertTriangle className="h-3.5 w-3.5" /> Cautions
        </button>
      </div>

      <button onClick={generate} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-baby-blue text-white">Regenerate routine</button>

      {loading && (
        <div className="flex flex-col items-center py-16 gap-3 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-navy" />
          <p className="text-sm">Dermo is crafting your routine…</p>
        </div>
      )}

      {error && <div className="rounded-2xl bg-destructive/10 border border-destructive/30 p-4 text-sm text-destructive">{error}</div>}

      {routine?.warnings && routine.warnings.length > 0 && (
        <div className="rounded-2xl bg-yellow-50 border border-yellow-200 p-4 text-sm text-yellow-900 flex gap-2">
          <AlertTriangle className="h-5 w-5 flex-none" />
          <ul className="space-y-1 list-disc pl-4">{routine.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}

      {focus.includes("Skin") && <Section title="Morning · Skin" Icon={Sun} steps={routine?.skin?.morning} onFind={onFind} />}
      {focus.includes("Skin") && <Section title="Night · Skin" Icon={Moon} steps={routine?.skin?.night} onFind={onFind} />}
      {focus.includes("Hair") && <Section title="Weekly · Hair" Icon={Sparkles} steps={routine?.hair?.weekly} onFind={onFind} />}
      {focus.includes("Nails") && <Section title="Daily · Nails" Icon={Sparkles} steps={routine?.nails?.daily} onFind={onFind} />}

      <p className="text-[11px] text-center text-muted-foreground pt-4">Dermo AI does not replace professional medical care.</p>

      {showCaution && <CautionModal profile={profile} onClose={() => setShowCaution(false)} />}
    </div>
  );
};
