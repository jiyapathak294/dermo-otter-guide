import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile } from "@/lib/profile";
import { Loader2, ScanLine, ShieldCheck, ShieldAlert, ShieldX } from "lucide-react";

type Ingredient = { name: string; purpose: string; flag: "green" | "yellow" | "red"; note: string };
type Analysis = { product: string; verdict: "SAFE" | "CAUTION" | "UNSAFE"; summary: string; ingredients: Ingredient[]; alternatives: string[] };

const verdictMap = {
  SAFE: { Icon: ShieldCheck, color: "text-green-700 bg-green-50 border-green-200" },
  CAUTION: { Icon: ShieldAlert, color: "text-yellow-800 bg-yellow-50 border-yellow-200" },
  UNSAFE: { Icon: ShieldX, color: "text-red-700 bg-red-50 border-red-200" },
};
const flagDot: Record<string, string> = { green: "bg-green-500", yellow: "bg-yellow-500", red: "bg-red-500" };

export const ScanTab = () => {
  const [input, setInput] = useState("");
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (!input.trim()) return;
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("ingredient-analyzer", { body: { productOrIngredients: input, profile: loadProfile() } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const V = analysis ? verdictMap[analysis.verdict] : null;

  return (
    <div className="px-5 pt-6 pb-6 space-y-4">
      <h2 className="font-heading text-2xl text-navy">Ingredient Scanner</h2>
      <p className="text-sm text-muted-foreground">Paste a product name or full ingredient list.</p>
      <textarea
        value={input} onChange={(e) => setInput(e.target.value)}
        rows={4} placeholder="e.g. La Roche-Posay Effaclar Duo&#10;or: Aqua, Niacinamide, Salicylic Acid..."
        className="w-full rounded-2xl border-2 border-navy px-4 py-3 text-sm outline-none focus:border-jazz-blue"
      />
      <button onClick={analyze} disabled={loading} className="w-full rounded-2xl bg-baby-blue text-navy font-heading py-3 flex items-center justify-center gap-2">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanLine className="h-5 w-5" />}
        {loading ? "Analyzing…" : "Analyze"}
      </button>

      {error && <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {analysis && V && (
        <div className="space-y-3">
          <div className={`rounded-2xl border p-4 ${V.color}`}>
            <div className="flex items-center gap-2"><V.Icon className="h-6 w-6" /><span className="font-heading text-lg">{analysis.verdict}</span></div>
            <p className="font-semibold mt-1">{analysis.product}</p>
            <p className="text-sm mt-1">{analysis.summary}</p>
          </div>
          <div className="space-y-2">
            {analysis.ingredients.map((i, k) => (
              <div key={k} className="rounded-xl bg-white border border-border p-3 flex gap-3">
                <span className={`h-3 w-3 mt-1.5 rounded-full flex-none ${flagDot[i.flag]}`} />
                <div>
                  <p className="font-semibold text-sm text-navy">{i.name} <span className="text-muted-foreground font-normal">· {i.purpose}</span></p>
                  <p className="text-xs text-foreground mt-0.5">{i.note}</p>
                </div>
              </div>
            ))}
          </div>
          {analysis.alternatives?.length > 0 && (
            <div className="rounded-2xl bg-baby-blue/40 p-4">
              <p className="font-heading text-navy mb-1">Safer alternatives</p>
              <ul className="text-sm list-disc pl-5 space-y-0.5">{analysis.alternatives.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
