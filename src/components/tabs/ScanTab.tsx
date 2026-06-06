import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile } from "@/lib/profile";
import {
  Loader2, ShieldCheck, ShieldAlert, ShieldX, ArrowLeft, Image as ImageIcon,
  Camera, X, ChevronRight, Sparkles,
} from "lucide-react";
import { DermoLogo } from "@/components/DermoLogo";

type Candidate = {
  brand: string; name: string; category?: string; size?: string;
  confidence?: number; summary?: string; image?: string; price?: string;
  product_link?: string; source?: string;
};
type Ingredient = { name: string; purpose: string; flag: "green" | "yellow" | "red"; note: string };
type Analysis = {
  product: string; verdict: "SAFE" | "CAUTION" | "UNSAFE";
  summary: string; ingredients: Ingredient[]; alternatives: string[];
};

const verdictMap = {
  SAFE:    { Icon: ShieldCheck, label: "Safe for you",   chip: "bg-green-100 text-green-800 border-green-200",   bar: "bg-green-500" },
  CAUTION: { Icon: ShieldAlert, label: "Use with caution", chip: "bg-yellow-100 text-yellow-900 border-yellow-200", bar: "bg-yellow-500" },
  UNSAFE:  { Icon: ShieldX,     label: "Not recommended", chip: "bg-red-100 text-red-800 border-red-200",         bar: "bg-red-500" },
};
const flagDot: Record<string, string> = { green: "bg-green-500", yellow: "bg-yellow-500", red: "bg-red-500" };

const DARK = "#373a45";
type Stage = "scan" | "candidates" | "details";

const Brackets = () => (
  <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full pointer-events-none">
    <g stroke="#ffffff" strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.95">
      <path d="M30 60 V30 H60" />
      <path d="M170 60 V30 H140" />
      <path d="M30 140 V170 H60" />
      <path d="M170 140 V170 H140" />
    </g>
  </svg>
);

export const ScanTab = () => {
  const [stage, setStage] = useState<Stage>("scan");
  const [camState, setCamState] = useState<"idle" | "requesting" | "live" | "denied" | "unavailable">("idle");
  const [imageData, setImageData] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [detecting, setDetecting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scanLine, setScanLine] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const autoTimer = useRef<number | null>(null);

  // ---- camera ----
  const stopCam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (autoTimer.current) { window.clearTimeout(autoTimer.current); autoTimer.current = null; }
  };

  const startCam = async () => {
    setError(null);
    setAnalysis(null); setCandidates([]); setSelected(null); setImageData(null);
    setStage("scan");
    if (!navigator.mediaDevices?.getUserMedia) { setCamState("unavailable"); return; }
    setCamState("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 1280 } },
        audio: false,
      });
      streamRef.current = stream;
      setCamState("live");
      requestAnimationFrame(async () => {
        const v = videoRef.current; if (!v) return;
        v.srcObject = stream; v.muted = true; v.setAttribute("playsinline", "true");
        try { await v.play(); } catch { /* ignore */ }
        // Auto lens-capture: scanning animation, then snap
        setScanLine(true);
        autoTimer.current = window.setTimeout(() => autoCapture(), 2600);
      });
    } catch (e: any) {
      setCamState(e?.name === "NotAllowedError" ? "denied" : "unavailable");
    }
  };

  useEffect(() => () => stopCam(), []);

  const grabFrame = (): string | null => {
    const v = videoRef.current; if (!v || !v.videoWidth) return null;
    const canvas = document.createElement("canvas");
    canvas.width = v.videoWidth; canvas.height = v.videoHeight;
    const ctx = canvas.getContext("2d"); if (!ctx) return null;
    ctx.drawImage(v, 0, 0);
    return canvas.toDataURL("image/jpeg", 0.85);
  };

  const detectFromImage = async (img: string) => {
    setDetecting(true); setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("product-detect", { body: { image: img } });
      if (error) throw error;
      if (data?.error && data?.is_product === false) {
        // Not a product — surface a friendly message and stay on scan screen
        setError(data.error || "No product shown. Please point the camera at a skincare, hair, or nail product.");
        setCandidates([]);
        setStage("scan");
        return;
      }
      if (data?.error) throw new Error(data.error);
      const list: Candidate[] = data?.candidates || [];
      if (list.length === 0) {
        setError("No product shown. Please point the camera at a skincare, hair, or nail product.");
        setStage("scan");
        return;
      }
      setCandidates(list);
      setStage("candidates");
    } catch (e: any) { setError(e.message); setStage("scan"); }
    finally { setDetecting(false); setScanLine(false); }
  };

  const autoCapture = async () => {
    const img = grabFrame(); if (!img) return;
    setImageData(img); stopCam(); setCamState("idle");
    await detectFromImage(img);
  };

  const onFile = (f: File | null) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      const img = r.result as string;
      setImageData(img);
      await detectFromImage(img);
    };
    r.readAsDataURL(f);
  };

  const pickCandidate = async (c: Candidate) => {
    setSelected(c); setStage("details"); setAnalyzing(true); setError(null); setAnalysis(null);
    try {
      const { data, error } = await supabase.functions.invoke("ingredient-analyzer", {
        body: { profile: loadProfile(), productOrIngredients: `${c.brand} ${c.name}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data.analysis);
    } catch (e: any) { setError(e.message); }
    finally { setAnalyzing(false); }
  };

  const reset = () => { stopCam(); setCamState("idle"); setStage("scan"); setImageData(null); setAnalysis(null); setSelected(null); setCandidates([]); };

  // ---- views ----

  const ScanView = (
    <>
      <div className="px-5 pt-7 pb-4 flex items-center gap-3 bg-white">
        <DermoLogo color={DARK} size={42} />
        <h1 className="font-heading text-[34px] text-foreground">Scan</h1>
      </div>

      <div className="relative aspect-[3/4.2] bg-black overflow-hidden">
        {camState === "live" && (
          <video ref={videoRef} playsInline muted autoPlay className="w-full h-full object-cover" />
        )}
        {camState !== "live" && (
          <div className="absolute inset-0 bg-gradient-to-br from-spa-mist to-baby-blue/40 flex flex-col items-center justify-center gap-4 px-6 text-center">
            <Camera className="h-10 w-10 text-foreground/60" />
            <p className="text-sm text-foreground/80 max-w-xs">Point the lens at a product. Dermo will identify it automatically — no button needed.</p>
            {camState === "denied" && <p className="text-xs text-destructive">Camera permission denied. Enable it in your browser settings.</p>}
            {camState === "unavailable" && <p className="text-xs text-muted-foreground">Camera unavailable on this device. Use the library instead.</p>}
            {camState === "requesting" && <Loader2 className="h-6 w-6 animate-spin text-foreground/60" />}
            {(camState === "idle" || camState === "denied" || camState === "unavailable") && (
              <div className="flex flex-col items-center gap-3 w-full max-w-[220px]">
                <button onClick={startCam} className="w-full rounded-full bg-foreground text-white px-5 py-3 text-sm font-bold inline-flex items-center justify-center gap-2 active:scale-95">
                  <Camera className="h-4 w-4" /> Enable camera
                </button>
                <span className="text-xs text-foreground/50 font-medium">or</span>
                <button onClick={() => fileRef.current?.click()} className="w-full rounded-full bg-white/80 text-foreground px-5 py-3 text-sm font-bold inline-flex items-center justify-center gap-2 active:scale-95 border border-foreground/10">
                  <ImageIcon className="h-4 w-4" /> From library
                </button>
              </div>
            )}
          </div>
        )}

        {/* Bracket framing */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="relative w-[78%] aspect-square">
            <Brackets />
            {camState === "live" && scanLine && (
              <div className="absolute inset-x-2 top-0 h-[3px] bg-white/90 shadow-[0_0_18px_4px_rgba(255,255,255,0.7)] animate-[scanline_2.4s_ease-in-out_infinite]" />
            )}
          </div>
        </div>

        {/* Status pill */}
        {camState === "live" && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/55 backdrop-blur px-4 py-1.5 text-white text-xs font-semibold inline-flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5" />
            {detecting ? "Identifying…" : "Locating product…"}
          </div>
        )}

        {(camState === "live") && (
          <button onClick={reset} className="absolute top-4 left-4 h-11 w-11 rounded-full bg-black/45 backdrop-blur flex items-center justify-center" aria-label="Close camera">
            <X className="h-5 w-5 text-white" strokeWidth={2.6} />
          </button>
        )}
      </div>

      {/* Bottom row — only shown when camera is live */}
      {camState === "live" && (
        <div className="px-5 py-4 flex gap-3">
          <button onClick={autoCapture} disabled={detecting} className="flex-1 rounded-2xl py-3 font-bold text-sm text-white active:scale-95 disabled:opacity-60" style={{ background: DARK }}>
            {detecting ? "Identifying…" : "Identify now"}
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />

      {error && <div className="mx-5 mb-4 rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
      <p className="text-[11px] text-center text-muted-foreground pb-4">Dermo AI does not replace professional medical care.</p>
    </>
  );

  const CandidatesSheet = (
    <div className="absolute inset-0 z-50 flex flex-col justify-end" role="dialog" aria-modal="true">
      <button className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={reset} aria-label="Close" />
      <div className="relative bg-white rounded-t-[28px] max-h-[82%] flex flex-col animate-[slideUp_0.25s_ease-out]">
        <div className="pt-3 pb-2 flex justify-center"><span className="h-1.5 w-12 rounded-full bg-foreground/20" /></div>
        <div className="px-5 pb-3 flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">We found these</p>
            <h2 className="font-heading text-[26px] leading-tight text-foreground">Pick the product that matches</h2>
          </div>
          <button onClick={reset} className="h-9 w-9 rounded-full bg-spa-mist flex items-center justify-center" aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>

        {imageData && (
          <div className="px-5 pb-3">
            <div className="rounded-2xl overflow-hidden bg-spa-mist aspect-[5/2]">
              <img src={imageData} alt="Captured" className="w-full h-full object-cover" />
            </div>
          </div>
        )}

        <div className="px-3 pb-6 overflow-y-auto">
          {candidates.length === 0 && (
            <div className="text-center text-sm text-muted-foreground py-8">No products detected. Try again with better lighting.</div>
          )}
          <ul className="space-y-2">
            {candidates.map((c, i) => (
              <li key={i}>
                <button onClick={() => pickCandidate(c)} className="w-full flex items-center gap-3 p-3 rounded-2xl hover:bg-spa-mist active:scale-[0.99] transition text-left">
                  <div className="h-16 w-16 rounded-xl bg-spa-mist overflow-hidden flex-none flex items-center justify-center">
                    {c.image ? <img src={c.image} alt="" className="w-full h-full object-cover" /> : <Camera className="h-5 w-5 text-foreground/40" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.brand}</p>
                    <p className="font-heading text-foreground text-[17px] leading-snug truncate">{c.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.size || c.category || c.summary}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {typeof c.confidence === "number" && (
                      <span className="text-[10px] font-bold text-foreground/70">{Math.round(c.confidence * 100)}%</span>
                    )}
                    <ChevronRight className="h-5 w-5 text-foreground/50" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
          <button onClick={reset} className="w-full mt-4 rounded-2xl py-3 text-sm font-bold bg-spa-mist text-foreground">
            None of these — scan again
          </button>
        </div>
      </div>
    </div>
  );

  const DetailsView = () => {
    if (!selected) return null;
    const V = analysis ? verdictMap[analysis.verdict] : null;
    return (
      <div className="min-h-full bg-white">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-3 flex items-center gap-3 border-b border-border">
          <button onClick={() => { setStage("candidates"); setAnalysis(null); }} className="h-10 w-10 rounded-full bg-spa-mist flex items-center justify-center" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="font-heading text-[20px] truncate">Product details</p>
        </div>

        {/* Hero */}
        <div className="px-5 pt-4 pb-5">
          <div className="rounded-3xl bg-gradient-to-br from-spa-mist to-baby-blue/40 p-5 flex gap-4">
            <div className="h-28 w-28 rounded-2xl bg-white overflow-hidden flex-none flex items-center justify-center shadow-sm">
              {selected.image ? <img src={selected.image} alt="" className="w-full h-full object-cover" /> : imageData ? <img src={imageData} alt="" className="w-full h-full object-cover" /> : <Camera className="h-6 w-6 text-foreground/40" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{selected.brand}</p>
              <h2 className="font-heading text-foreground text-[22px] leading-tight">{selected.name}</h2>
              {selected.size && <p className="text-xs text-muted-foreground mt-1">{selected.size}</p>}
              {selected.price && <p className="text-sm font-bold mt-2 text-foreground">{selected.price}</p>}
            </div>
          </div>
        </div>

        {/* Verdict */}
        <div className="px-5">
          {analyzing && (
            <div className="rounded-2xl bg-spa-mist p-5 flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin" />
              <p className="text-sm">Checking ingredients against your profile…</p>
            </div>
          )}
          {error && <div className="rounded-2xl bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          {analysis && V && (
            <div className={`rounded-2xl border p-4 ${V.chip}`}>
              <div className="flex items-center gap-2">
                <V.Icon className="h-6 w-6" />
                <span className="font-heading text-lg">{V.label}</span>
              </div>
              <p className="text-sm mt-1">{analysis.summary}</p>
            </div>
          )}
        </div>

        {/* Ingredients */}
        {analysis && (
          <div className="px-5 pt-5 pb-8">
            <p className="font-heading text-foreground text-[22px] mb-3">Ingredients</p>

            {/* mini legend bar */}
            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-green-500" /> Safe</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-yellow-500" /> Caution</span>
              <span className="inline-flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-red-500" /> Avoid</span>
            </div>

            <ul className="space-y-2">
              {analysis.ingredients.map((i, k) => (
                <li key={k} className="rounded-2xl border border-border bg-white p-3 flex gap-3">
                  <span className={`h-3 w-3 mt-1.5 rounded-full flex-none ${flagDot[i.flag]}`} />
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-foreground">
                      {i.name} <span className="text-muted-foreground font-normal">· {i.purpose}</span>
                    </p>
                    <p className="text-xs text-foreground/80 mt-0.5">{i.note}</p>
                  </div>
                </li>
              ))}
            </ul>

            {analysis.alternatives?.length > 0 && (
              <div className="rounded-2xl bg-baby-blue/40 p-4 mt-5">
                <p className="font-heading text-foreground mb-1">Safer alternatives</p>
                <ul className="text-sm list-disc pl-5 space-y-0.5">
                  {analysis.alternatives.map((a, i) => <li key={i}>{a}</li>)}
                </ul>
              </div>
            )}

            <button onClick={reset} className="w-full mt-5 rounded-2xl py-3 text-sm font-bold text-white" style={{ background: DARK }}>
              Scan another product
            </button>
            <p className="text-[11px] text-center text-muted-foreground pt-3">Dermo AI does not replace professional medical care.</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-full bg-white">
      {stage === "details" ? <DetailsView /> : ScanView}
      {stage === "candidates" && CandidatesSheet}

      {/* Detecting overlay while popup is loading */}
      {detecting && stage === "scan" && (
        <div className="absolute inset-0 z-40 bg-black/40 flex items-center justify-center">
          <div className="rounded-2xl bg-white px-5 py-4 inline-flex items-center gap-3 shadow-xl">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span className="text-sm font-semibold">Identifying product…</span>
          </div>
        </div>
      )}
    </div>
  );
};
