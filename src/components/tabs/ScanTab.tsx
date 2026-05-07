import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile } from "@/lib/profile";
import { Loader2, ShieldCheck, ShieldAlert, ShieldX, ArrowLeft, Image as ImageIcon } from "lucide-react";
import { DermoLogo } from "@/components/DermoLogo";

type Ingredient = { name: string; purpose: string; flag: "green" | "yellow" | "red"; note: string };
type Analysis = { product: string; verdict: "SAFE" | "CAUTION" | "UNSAFE"; summary: string; ingredients: Ingredient[]; alternatives: string[] };

const verdictMap = {
  SAFE: { Icon: ShieldCheck, color: "text-green-700 bg-green-50 border-green-200" },
  CAUTION: { Icon: ShieldAlert, color: "text-yellow-800 bg-yellow-50 border-yellow-200" },
  UNSAFE: { Icon: ShieldX, color: "text-red-700 bg-red-50 border-red-200" },
};
const flagDot: Record<string, string> = { green: "bg-green-500", yellow: "bg-yellow-500", red: "bg-red-500" };

const DARK = "#373a45";

const Brackets = () => (
  <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full pointer-events-none">
    <g stroke={DARK} strokeWidth="6" fill="none" strokeLinecap="round">
      <path d="M30 60 V30 H60" />
      <path d="M170 60 V30 H140" />
      <path d="M30 140 V170 H60" />
      <path d="M170 140 V170 H140" />
    </g>
  </svg>
);

export const ScanTab = () => {
  const [imageData, setImageData] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = (f: File | null) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = () => { setImageData(r.result as string); setAnalysis(null); };
    r.readAsDataURL(f);
  };

  const analyze = async () => {
    if (!imageData) return;
    setLoading(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("ingredient-analyzer", { body: { profile: loadProfile(), image: imageData } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const V = analysis ? verdictMap[analysis.verdict] : null;

  return (
    <div className="relative min-h-full bg-white">
      <div className="px-5 pt-7 pb-4 flex items-center gap-3 bg-white">
        <DermoLogo color={DARK} size={42} />
        <h1 className="font-heading text-[34px] text-foreground">Scan</h1>
      </div>

      {/* Camera viewport */}
      <div className="relative aspect-[3/4.2] bg-spa-mist overflow-hidden">
        {imageData ? (
          <img src={imageData} alt="Scanned product" className="w-full h-full object-cover" />
        ) : (
          <div
            className="w-full h-full bg-gradient-to-br from-spa-mist to-baby-blue/40 flex items-center justify-center"
          >
            <p className="text-muted-foreground text-sm">Tap a button below to capture</p>
          </div>
        )}

        {/* Bracket overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-[78%] aspect-square">
            <Brackets />
          </div>
        </div>

        {/* Top-left back arrow */}
        <button
          onClick={() => { setImageData(null); setAnalysis(null); }}
          className="absolute top-4 left-4 h-11 w-11 rounded-full bg-foreground/40 backdrop-blur flex items-center justify-center"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5 text-white" strokeWidth={2.6} />
        </button>
      </div>

      {/* Action row */}
      <div className="px-5 py-4 flex gap-3">
        <button
          onClick={() => camRef.current?.click()}
          className="flex-1 rounded-2xl py-3 font-bold text-white text-sm active:scale-95"
          style={{ background: DARK }}
        >
          Capture
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className="h-12 w-12 rounded-2xl bg-spa-mist flex items-center justify-center"
          aria-label="From library"
        >
          <ImageIcon className="h-5 w-5" stroke={DARK} />
        </button>
        <button
          onClick={analyze}
          disabled={loading || !imageData}
          className="flex-1 rounded-2xl py-3 font-bold text-white text-sm active:scale-95 disabled:opacity-40"
          style={{ background: "hsl(var(--navy))" }}
        >
          {loading ? "Analyzing…" : "Analyze"}
        </button>
      </div>

      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />

      <div className="px-5 pb-6 space-y-3">
        {loading && <div className="flex justify-center py-6"><Loader2 className="h-7 w-7 animate-spin text-navy" /></div>}
        {error && <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

        {analysis && V && (
          <div className="space-y-3 animate-fade-in">
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
                    <p className="font-semibold text-sm text-foreground">{i.name} <span className="text-muted-foreground font-normal">· {i.purpose}</span></p>
                    <p className="text-xs text-foreground mt-0.5">{i.note}</p>
                  </div>
                </div>
              ))}
            </div>
            {analysis.alternatives?.length > 0 && (
              <div className="rounded-2xl bg-baby-blue/40 p-4">
                <p className="font-heading text-foreground mb-1">Safer alternatives</p>
                <ul className="text-sm list-disc pl-5 space-y-0.5">{analysis.alternatives.map((a, i) => <li key={i}>{a}</li>)}</ul>
              </div>
            )}
          </div>
        )}
        <p className="text-[11px] text-center text-muted-foreground pt-2">Dermo AI does not replace professional medical care.</p>
      </div>
    </div>
  );
};
