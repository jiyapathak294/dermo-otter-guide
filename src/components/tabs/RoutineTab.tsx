import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile } from "@/lib/profile";
import { Sun, Moon, AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { CautionModal } from "@/components/CautionModal";
import { DermoLogo } from "@/components/DermoLogo";

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
    <div className="rounded-3xl bg-white p-5 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="h-9 w-9 rounded-full bg-baby-blue/40 text-foreground/60 flex items-center justify-center text-sm font-medium flex-none">
          {n}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-heading text-foreground text-[19px] leading-tight">{s.step}</p>
          <p className="text-[12px] text-muted-foreground mt-1">
            {s.product_type} · {s.ingredient}
          </p>
          <div className="flex flex-col gap-2 mt-3 items-start">
            <button
              onClick={() => setOpen(!open)}
              className="rounded-full border border-foreground bg-white text-xs font-bold py-1.5 px-4 active:scale-95 inline-flex items-center gap-1.5"
            >
              Why? <Sparkles className="h-3 w-3" />
            </button>
            <button
              onClick={() => onFind(`${s.product_type} with ${s.ingredient}`)}
              className="rounded-full border border-foreground bg-white text-xs font-bold py-1.5 px-4 active:scale-95 inline-flex items-center gap-1.5"
            >
              Find Products
              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="5" y="7" width="6" height="10" rx="1.5" />
                <rect x="13" y="5" width="6" height="12" rx="1.5" />
              </svg>
            </button>
          </div>
        </div>
        <div className="w-20 flex flex-col items-center text-center flex-none">
          <div className="h-20 w-20 rounded-xl bg-spa-mist flex items-center justify-center text-[10px] text-muted-foreground">
            product
          </div>
          <p className="text-[10px] font-bold mt-1 text-foreground/70 tracking-wider">YOUR CHOICE:</p>
        </div>
      </div>
      {open && (
        <div className="mt-3 rounded-xl bg-spa-mist p-3 animate-fade-in">
          <p className="text-sm text-foreground">{s.why}</p>
        </div>
      )}
    </div>
  );
};

type FocusKey = "Skin" | "Hair" | "Nails";
type TimeKey = "morning" | "night" | "weekly" | "daily";

export const RoutineTab = ({ onFindProducts }: { onFindProducts?: (q: string) => void }) => {
  const [routine, setRoutine] = useState<Routine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCaution, setShowCaution] = useState(false);
  const profile = loadProfile();
  const focus: FocusKey[] = ((profile?.focus as FocusKey[]) || ["Skin"]).filter((f) =>
    ["Skin", "Hair", "Nails"].includes(f)
  ) as FocusKey[];
  const [activeFocus, setActiveFocus] = useState<FocusKey>(focus[0] || "Skin");
  const [activeTime, setActiveTime] = useState<TimeKey>("morning");

  const generate = async () => {
    setLoading(true); setError(null);
    if (!profile) { setLoading(false); setError("No profile found."); return; }
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

  // Pick available time for active focus
  const timesFor = (f: FocusKey): { key: TimeKey; label: string; Icon: any }[] => {
    if (f === "Skin") return [
      { key: "morning", label: "Morning", Icon: Sun },
      { key: "night", label: "Night", Icon: Moon },
    ];
    if (f === "Hair") return [{ key: "weekly", label: "Weekly", Icon: Sparkles }];
    return [{ key: "daily", label: "Daily", Icon: Sparkles }];
  };

  const stepsFor = (): Step[] => {
    if (!routine) return [];
    if (activeFocus === "Skin") return (activeTime === "night" ? routine.skin?.night : routine.skin?.morning) || [];
    if (activeFocus === "Hair") return routine.hair?.weekly || [];
    return routine.nails?.daily || [];
  };
  const times = timesFor(activeFocus);
  const currentTime = times.find((t) => t.key === activeTime) || times[0];
  const TimeIcon = currentTime?.Icon || Sun;

  return (
    <div className="relative min-h-full bg-white">
      {/* Header */}
      <div className="px-5 pt-7 pb-5 flex items-center gap-3 bg-white">
        <DermoLogo color="hsl(var(--jazz-blue))" size={42} />
        <h1 className="font-heading text-[34px] text-foreground">Your Routine</h1>
      </div>

      {/* Blue gradient body */}
      <div
        className="px-4 pt-5 pb-10 space-y-4 rounded-t-[28px]"
        style={{ background: "linear-gradient(180deg, #aab5fb 0%, #aab5fb 100%)" }}
      >
        {/* Caution chip */}
        <button
          onClick={() => setShowCaution(true)}
          aria-label="Cautions"
          className="h-11 w-11 rounded-full bg-white shadow-soft flex items-center justify-center active:scale-95"
        >
          <AlertTriangle className="h-5 w-5" stroke="hsl(var(--navy))" />
        </button>

        {/* Time/focus card with tabs */}
        <div className="rounded-3xl bg-white px-5 py-4 shadow-soft">
          <div className="flex items-center gap-3">
            <p className="font-heading text-foreground text-2xl">
              {currentTime?.label} · {activeFocus}
            </p>
            <TimeIcon className="h-7 w-7" stroke="hsl(var(--jazz-blue))" />
          </div>
          {/* Focus tabs */}
          <div className="flex gap-5 mt-2">
            {(["Skin", "Hair", "Nails"] as FocusKey[]).map((f) => {
              const on = f === activeFocus;
              return (
                <button
                  key={f}
                  onClick={() => {
                    setActiveFocus(f);
                    const t = timesFor(f);
                    setActiveTime(t[0].key);
                  }}
                  className={`relative pb-1 text-sm ${on ? "font-bold text-foreground" : "text-muted-foreground"}`}
                >
                  {f}
                  {on && <span className="absolute -bottom-0.5 left-0 right-0 h-1 rounded-full bg-jazz-blue" />}
                </button>
              );
            })}
          </div>
          {times.length > 1 && (
            <div className="flex gap-3 mt-3">
              {times.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setActiveTime(t.key)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full ${activeTime === t.key ? "bg-baby-blue text-foreground" : "bg-muted text-muted-foreground"}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="flex flex-col items-center py-16 gap-3 text-foreground/70">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-sm">Dermo is crafting your routine…</p>
          </div>
        )}

        {error && <div className="rounded-2xl bg-white p-4 text-sm text-destructive">{error}</div>}

        {routine?.warnings && routine.warnings.length > 0 && (
          <div className="rounded-2xl bg-white p-4 text-sm text-foreground/80 flex gap-2">
            <AlertTriangle className="h-5 w-5 flex-none text-yellow-600" />
            <ul className="space-y-1 list-disc pl-4">{routine.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
        )}

        {stepsFor().map((s, i) => (
          <StepCard key={i} s={s} n={i + 1} onFind={(q) => onFindProducts?.(q)} />
        ))}

        <button
          onClick={generate}
          className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/80 text-foreground mx-auto block mt-2"
        >
          Regenerate
        </button>
        <p className="text-[11px] text-center text-foreground/70 pt-2">
          Dermo AI does not replace professional medical care.
        </p>
      </div>

      {showCaution && <CautionModal profile={profile} onClose={() => setShowCaution(false)} />}
    </div>
  );
};
