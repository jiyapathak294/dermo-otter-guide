import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile } from "@/lib/profile";
import { Sparkles, FlaskConical, Leaf, CheckCircle2 } from "lucide-react";
import otter from "@/assets/dermo-otter.png";

const steps = [
  { Icon: Sparkles, label: "Reading your survey" },
  { Icon: FlaskConical, label: "Designing your routine" },
  { Icon: Leaf, label: "Curating gentle products" },
  { Icon: CheckCircle2, label: "Finalizing your plan" },
];

export const Analyzing = ({ onDone }: { onDone: () => void }) => {
  const [progress, setProgress] = useState(0);
  const [stepIdx, setStepIdx] = useState(0);
  const ready = useRef(false);
  const minDone = useRef(false);
  const tryFinish = () => {
    if (ready.current && minDone.current) onDone();
  };

  // Kick off background AI work — routine + product enrichment
  useEffect(() => {
    const profile = loadProfile();
    if (!profile) { ready.current = true; tryFinish(); return; }

    (async () => {
      try {
        const { data } = await supabase.functions.invoke("routine-generator", { body: { profile } });
        if (data?.routine) localStorage.setItem("dermo.routine.v1", JSON.stringify(data.routine));
      } catch (_) { /* non-blocking */ }
      try {
        const q = profile.focus?.includes("Skin") ? "everyday essentials for my skin type"
          : profile.focus?.includes("Hair") ? "haircare essentials"
          : "nailcare essentials";
        const { data } = await supabase.functions.invoke("product-search", { body: { query: q, profile } });
        if (Array.isArray(data?.results)) localStorage.setItem("dermo.recommended.v1", JSON.stringify(data.results));
      } catch (_) { /* non-blocking */ }
      ready.current = true;
      tryFinish();
    })();

    // Min 3.2s display
    const t = setTimeout(() => { minDone.current = true; tryFinish(); }, 3200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animated progress + step rotation
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 3000, 1);
      // ease-out
      const eased = 1 - Math.pow(1 - t, 3);
      const value = ready.current && minDone.current ? 100 : Math.min(eased * 92, 92);
      setProgress(value);
      setStepIdx(Math.min(Math.floor(value / 25), steps.length - 1));
      if (value < 100) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="app-frame bg-gradient-to-b from-white to-[hsl(var(--lavender)/0.18)] flex flex-col items-center px-6">
      <div className="mt-20 text-center animate-fade-in">
        <h1 className="font-heading text-[34px] text-foreground leading-tight">Crafting your plan</h1>
        <p className="mt-2 text-sm text-muted-foreground max-w-[260px] mx-auto">
          Dermo is analyzing your answers and curating products just for you.
        </p>
      </div>

      {/* Halo with otter */}
      <div className="relative mt-10">
        <div className="absolute inset-0 rounded-full bg-[hsl(var(--lavender)/0.4)] blur-2xl scale-110" />
        <div className="relative h-44 w-44 rounded-full bg-white shadow-soft flex items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
            style={{ borderTopColor: "hsl(var(--lavender-deep))", animationDuration: "1.6s" }}
          />
          <img src={otter} alt="" className="h-32 w-32 object-contain animate-otter-bob" />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-[280px] mt-10">
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%`, background: "linear-gradient(90deg, hsl(var(--lavender)) 0%, hsl(var(--lavender-deep)) 100%)" }}
          />
        </div>
        <p className="text-center text-xs text-muted-foreground mt-2 font-semibold">{Math.round(progress)}%</p>
      </div>

      {/* Step list */}
      <ul className="mt-6 w-full max-w-[280px] space-y-2">
        {steps.map((s, i) => {
          const active = i === stepIdx;
          const done = i < stepIdx;
          const Icon = s.Icon;
          return (
            <li
              key={i}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 transition-all ${
                active ? "bg-white shadow-soft scale-[1.02]" : done ? "bg-white/60" : "bg-white/30"
              }`}
            >
              <span className={`h-7 w-7 rounded-full flex items-center justify-center ${
                done ? "bg-green-100 text-green-700" : active ? "bg-[hsl(var(--lavender)/0.3)] text-[hsl(var(--lavender-deep))]" : "bg-muted text-muted-foreground"
              }`}>
                {done ? <CheckCircle2 className="h-4 w-4" /> : <Icon className={`h-4 w-4 ${active ? "animate-pulse" : ""}`} />}
              </span>
              <span className={`text-sm ${active ? "font-bold text-foreground" : done ? "text-foreground/70" : "text-muted-foreground"}`}>
                {s.label}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
