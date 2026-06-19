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
type ScanPhase = "roaming" | "locked" | "identifying";

// Corner-bracket frame
const Brackets = ({ color = "#ffffff" }: { color?: string }) => (
  <svg viewBox="0 0 200 200" className="absolute inset-0 w-full h-full pointer-events-none">
    <g stroke={color} strokeWidth="6" fill="none" strokeLinecap="round" opacity="0.98">
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
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<ScanPhase>("roaming");

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pollTimer = useRef<number | null>(null);
  const busy = useRef(false);
  const cancelled = useRef(false);

  // ---- camera lifecycle ----
  const stopCam = () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (pollTimer.current) { window.clearTimeout(pollTimer.current); pollTimer.current = null; }
    cancelled.current = true;
  };

  const startCam = async () => {
    setError(null);
    setAnalysis(null); setCandidates([]); setSelected(null); setImageData(null);
    setStage("scan"); setPhase("roaming");
    cancelled.current = false;
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
        // Wait a beat then start polling detection
        pollTimer.current = window.setTimeout(pollDetect, 1200);
      });
    } catch (e: any) {
      setCamState(e?.name === "NotAllowedError" ? "denied" : "unavailable");
    }
  };

  // Auto-start camera on mount; cleanup on unmount
  useEffect(() => {
    startCam();
    return () => stopCam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const grabFrame = (): string | null => {
    const v = videoRef.current; if (!v || !v.videoWidth) return null;
    const canvas = document.createElement("canvas");
    const targetW = Math.min(720, v.videoWidth);
    const scale = targetW / v.videoWidth;
    canvas.width = targetW; canvas.height = Math.round(v.videoHeight * scale);
    const ctx = canvas.getContext("2d"); if (!ctx) return null;
    ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.78);
  };

  // Continuous detection: snap a frame, ask AI if it's a product. If yes → lock and proceed.
  const pollDetect = async () => {
    if (cancelled.current || busy.current) return;
    busy.current = true;
    try {
      const img = grabFrame();
      if (!img) { schedule(800); return; }
      const { data } = await supabase.functions.invoke("product-detect", { body: { image: img } });
      if (cancelled.current) return;
      if (data?.is_product && Array.isArray(data.candidates) && data.candidates.length > 0) {
        // Lock onto product
        setPhase("locked");
        setImageData(img);
        setCandidates(data.candidates);
        // Hold steady moment, then identify
        window.setTimeout(() => {
          if (cancelled.current) return;
          setPhase("identifying");
          // Brief "scanning" beat, then surface results
          window.setTimeout(() => {
            if (cancelled.current) return;
            stopCam();
            setCamState("idle");
            setStage("candidates");
          }, 700);
        }, 900);
        return;
      }
      // No product — keep roaming
      schedule(1400);
    } catch (e) {
      schedule(1800);
    } finally {
      busy.current = false;
    }
  };

  const schedule = (ms: number) => {
    if (cancelled.current) return;
    pollTimer.current = window.setTimeout(pollDetect, ms);
  };

  const detectFromImage = async (img: string) => {
    setError(null);
    setPhase("identifying");
    try {
      const { data, error } = await supabase.functions.invoke("product-detect", { body: { image: img } });
      if (error) throw error;
      if (!data?.is_product || !Array.isArray(data?.candidates) || data.candidates.length === 0) {
        setError(data?.error || "No product detected in this image.");
        setPhase("roaming");
        return;
      }
      setCandidates(data.candidates);
      setStage("candidates");
    } catch (e: any) { setError(e.message); setPhase("roaming"); }
  };

  const onFile = (f: File | null) => {
    if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      const img = r.result as string;
      setImageData(img);
      stopCam(); setCamState("idle");
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

  const reset = () => {
    stopCam(); setCamState("idle"); setStage("scan");
    setImageData(null); setAnalysis(null); setSelected(null); setCandidates([]); setPhase("roaming");
  };

  // ---- views ----

  const ScanView = (
    <div className="absolute inset-0 flex flex-col bg-white">
      {/* Header */}
      <div className="px-5 pt-5 pb-3 flex items-center gap-3 bg-white flex-none">
        <DermoLogo color={DARK} size={38} />
        <h1 className="font-heading text-[28px] text-foreground">Scan</h1>
      </div>

      {/* Camera viewport — fills available space */}
      <div className="relative flex-1 bg-black overflow-hidden">
        {camState === "live" && (
          <video ref={videoRef} playsInline muted autoPlay className="w-full h-full object-cover" />
        )}
        {camState !== "live" && (
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center gap-4 px-6 text-center text-white">
            {camState === "requesting" && <Loader2 className="h-7 w-7 animate-spin text-white/80" />}
            {camState === "requesting" && <p className="text-sm text-white/80">Starting camera…</p>}
            {camState === "denied" && <p className="text-xs text-white/80 max-w-[240px]">Camera permission denied. Enable it in your browser settings.</p>}
            {camState === "unavailable" && <p className="text-xs text-white/80 max-w-[240px]">Camera unavailable on this device.</p>}
            {(camState === "denied" || camState === "unavailable") && (
              <button onClick={() => fileRef.current?.click()} className="rounded-full bg-white text-foreground px-5 py-3 text-sm font-bold inline-flex items-center justify-center gap-2">
                <ImageIcon className="h-4 w-4" /> Use library photo
              </button>
            )}
          </div>
        )}

        {/* Playful roaming bracket frame (live only) */}
        {camState === "live" && (
          <>
            {/* Dim overlay */}
            <div className="absolute inset-0 bg-black/30 pointer-events-none" />

            {/* Roaming / snapping frame */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className={`relative w-[58%] aspect-square ${
                  phase === "roaming" ? "animate-scan-roam" : "animate-scan-snap"
                }`}
              >
                <Brackets color={phase === "locked" || phase === "identifying" ? "#a8ff9a" : "#ffffff"} />
                {phase === "identifying" && (
                  <div className="absolute inset-x-3 top-0 h-[3px] bg-white/90 shadow-[0_0_18px_4px_rgba(255,255,255,0.7)] animate-[scanline_1.2s_ease-in-out_infinite]" />
                )}
                {phase === "locked" && (
                  <div className="absolute inset-0 rounded-2xl ring-4 ring-[#a8ff9a]/70 animate-pulse" />
                )}
              </div>
            </div>

            {/* Status pill */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 rounded-full bg-black/65 backdrop-blur px-4 py-1.5 text-white text-xs font-semibold inline-flex items-center gap-2 max-w-[80%]">
              <Sparkles className={`h-3.5 w-3.5 ${phase === "roaming" ? "animate-pulse" : ""}`} />
              {phase === "roaming" && "Looking for a product…"}
              {phase === "locked" && "Got it! Hold steady…"}
              {phase === "identifying" && "Identifying…"}
            </div>

            {/* Close camera */}
            <button onClick={reset} className="absolute top-4 left-4 h-10 w-10 rounded-full bg-black/55 backdrop-blur flex items-center justify-center" aria-label="Close camera">
              <X className="h-5 w-5 text-white" strokeWidth={2.6} />
            </button>

            {/* Library shortcut */}
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute bottom-4 right-4 h-12 w-12 rounded-full bg-white/95 flex items-center justify-center shadow-soft"
              aria-label="From library"
            >
              <ImageIcon className="h-5 w-5 text-foreground" />
            </button>
          </>
        )}
      </div>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => onFile(e.target.files?.[0] || null)} />

      <div className="flex-none px-5 py-3 bg-white">
        {error && <div className="mb-2 rounded-2xl bg-destructive/10 p-2.5 text-xs text-destructive text-center">{error}</div>}
        <p className="text-[10.5px] text-center text-muted-foreground">Dermo AI does not replace professional medical care.</p>
      </div>
    </div>
  );

  // Baseline-loaded candidates sheet (candidates already captured before this opens)
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
          <button onClick={() => { setCandidates([]); setStage("scan"); startCam(); }} className="w-full mt-4 rounded-2xl py-3 text-sm font-bold bg-spa-mist text-foreground">
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
      <div className="absolute inset-0 bg-white flex flex-col">
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur px-4 py-3 flex items-center gap-3 border-b border-border flex-none">
          <button onClick={() => { setStage("candidates"); setAnalysis(null); }} className="h-10 w-10 rounded-full bg-spa-mist flex items-center justify-center" aria-label="Back">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <p className="font-heading text-[20px] truncate">Product details</p>
        </div>

        <div className="flex-1 overflow-y-auto">
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
      </div>
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {stage === "details" ? <DetailsView /> : ScanView}
      {stage === "candidates" && CandidatesSheet}
    </div>
  );
};
