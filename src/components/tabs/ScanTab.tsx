import { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile } from "@/lib/profile";
import { Loader2, ScanLine, ShieldCheck, ShieldAlert, ShieldX, Camera, Image as ImageIcon, Upload } from "lucide-react";

type Ingredient = { name: string; purpose: string; flag: "green" | "yellow" | "red"; note: string };
type Analysis = { product: string; verdict: "SAFE" | "CAUTION" | "UNSAFE"; summary: string; ingredients: Ingredient[]; alternatives: string[] };

const verdictMap = {
  SAFE: { Icon: ShieldCheck, color: "text-green-700 bg-green-50 border-green-200" },
  CAUTION: { Icon: ShieldAlert, color: "text-yellow-800 bg-yellow-50 border-yellow-200" },
  UNSAFE: { Icon: ShieldX, color: "text-red-700 bg-red-50 border-red-200" },
};
const flagDot: Record<string, string> = { green: "bg-green-500", yellow: "bg-yellow-500", red: "bg-red-500" };

export const ScanTab = () => {
  const [text, setText] = useState("");
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
    if (!text.trim() && !imageData) return;
    setLoading(true); setError(null);
    try {
      const body: any = { profile: loadProfile() };
      if (imageData) body.image = imageData;
      else body.productOrIngredients = text;
      const { data, error } = await supabase.functions.invoke("ingredient-analyzer", { body });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (e: any) { setError(e.message); } finally { setLoading(false); }
  };

  const V = analysis ? verdictMap[analysis.verdict] : null;

  return (
    <div className="px-5 pt-6 pb-6 space-y-4">
      <h2 className="font-heading text-2xl text-navy">Ingredient Scanner</h2>
      <p className="text-sm text-muted-foreground">Scan a product label, barcode, or ingredient list with your camera.</p>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={() => camRef.current?.click()} className="rounded-2xl bg-baby-blue p-5 flex flex-col items-center gap-2 text-white shadow-soft active:scale-95">
          <Camera className="h-7 w-7" />
          <span className="text-sm font-heading">Scan Product</span>
        </button>
        <button onClick={() => fileRef.current?.click()} className="rounded-2xl bg-spa-mist p-5 flex flex-col items-center gap-2 text-navy shadow-soft active:scale-95">
          <ImageIcon className="h-7 w-7" />
          <span className="text-sm font-heading">From Library</span>
        </button>
      </div>
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />
      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />

      {imageData && (
        <div className="rounded-2xl overflow-hidden border border-border">
          <img src={imageData} alt="Scanned product" className="w-full max-h-64 object-cover" />
          <div className="p-2 flex justify-between bg-white">
            <button onClick={() => { setImageData(null); setAnalysis(null); }} className="text-xs text-muted-foreground">Remove</button>
            <span className="text-xs text-muted-foreground">Ready to analyze</span>
          </div>
        </div>
      )}

      <div className="text-center text-xs text-muted-foreground">— or paste text —</div>
      <textarea
        value={text} onChange={(e) => setText(e.target.value)}
        rows={3} placeholder="Paste ingredients or product name…"
        className="w-full rounded-2xl border-2 border-navy px-4 py-3 text-sm outline-none focus:border-jazz-blue"
      />

      <button onClick={analyze} disabled={loading || (!text.trim() && !imageData)} className="w-full rounded-2xl bg-navy text-white font-heading py-3 flex items-center justify-center gap-2 disabled:opacity-50">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanLine className="h-5 w-5" />}
        {loading ? "Analyzing…" : "Analyze"}
      </button>

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
      <p className="text-[11px] text-center text-muted-foreground pt-2">Dermo AI does not replace professional medical care.</p>
    </div>
  );
};
