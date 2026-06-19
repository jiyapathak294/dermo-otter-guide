import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { loadProfile } from "@/lib/profile";
import { Sun, Moon, AlertTriangle, Sparkles, Plus, X, Loader2 } from "lucide-react";
import { CautionModal } from "@/components/CautionModal";
import { DermoLogo } from "@/components/DermoLogo";

type Step = {
  step: string;
  product_type: string;
  ingredient: string;
  why: string;
  isCustom?: boolean;
};
type Routine = {
  skin?: { morning?: Step[]; night?: Step[] };
  hair?: { weekly?: Step[] };
  nails?: { daily?: Step[] };
  warnings?: string[];
};

const LAVENDER_DEEP = "hsl(260 55% 55%)";

const slotKey = (focus: string, time: string, stepName: string) =>
  `${focus.toLowerCase()}:${time}:${stepName}`.replace(/\s+/g, "-").toLowerCase();

const StepCard = ({
  s, n, onFind, chosen, index, isReorder, onRename, dragHandlers,
}: {
  s: Step; n: number; onFind: (q: string) => void; chosen?: any; index: number;
  isReorder?: boolean;
  onRename?: (newName: string) => void;
  dragHandlers?: {
    onPointerDown: (e: React.PointerEvent) => void;
  };
}) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(s.step);

  useEffect(() => setDraft(s.step), [s.step]);

  const commit = () => {
    setEditing(false);
    const v = draft.trim();
    if (v && v !== s.step) onRename?.(v);
  };

  return (
    <div
      className="rounded-3xl bg-white p-5 shadow-soft animate-step-in select-none"
      style={{ animationDelay: `${index * 90}ms`, touchAction: isReorder ? "none" : "auto" }}
      {...(isReorder ? dragHandlers : {})}
    >
      <div className="flex items-start gap-3">
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center text-sm flex-none text-white font-heading"
          style={{ background: LAVENDER_DEEP }}
        >
          {n}
        </div>
        <div className="flex-1 min-w-0">
          {editing && s.isCustom ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") { setEditing(false); setDraft(s.step); } }}
              className="font-heading text-foreground text-[19px] leading-tight w-full bg-spa-mist rounded-lg px-2 py-1 outline-none"
            />
          ) : (
            <p
              className={`font-heading text-foreground text-[19px] leading-tight ${s.isCustom ? "cursor-text" : ""}`}
              onClick={() => { if (s.isCustom) setEditing(true); }}
            >
              {s.step}
              {s.isCustom && <span className="ml-2 text-[10px] font-sans font-normal text-muted-foreground">tap to rename</span>}
            </p>
          )}
          <p className="text-[12px] text-muted-foreground mt-1">
            {s.product_type} · {s.ingredient}
          </p>
        </div>
        <div className="w-20 flex-none">
          <div className="h-20 w-20 rounded-xl bg-spa-mist overflow-hidden flex items-center justify-center text-[10px] text-muted-foreground">
            {chosen?.image ? (
              <img src={chosen.image} alt={chosen.name} className="w-full h-full object-cover" />
            ) : (
              "Product"
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mt-3 pl-12">
        <button
          onClick={() => setOpen(!open)}
          className="rounded-full border border-foreground bg-white text-xs font-bold py-1.5 px-4 inline-flex items-center gap-1.5 hover:bg-foreground hover:text-white transition-colors"
        >
          Why? <Sparkles className="h-3 w-3" />
        </button>
        <button
          onClick={() => onFind(`${s.product_type} with ${s.ingredient}`)}
          className="rounded-full border border-foreground bg-white text-xs font-bold py-1.5 px-4 inline-flex items-center gap-1.5 hover:bg-foreground hover:text-white transition-colors"
        >
          Find Products
        </button>
      </div>

      {open && (
        <div className="mt-3 ml-12 rounded-xl bg-spa-mist p-3 animate-fade-in">
          <p className="text-sm text-foreground">{s.why}</p>
        </div>
      )}
    </div>
  );
};

const SkeletonStep = ({ i }: { i: number }) => (
  <div className="rounded-3xl bg-white p-5 shadow-soft animate-step-in" style={{ animationDelay: `${i * 90}ms` }}>
    <div className="flex items-start gap-3">
      <div className="h-9 w-9 rounded-full step-shimmer" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-3/4 rounded step-shimmer" />
        <div className="h-3 w-1/2 rounded step-shimmer" />
      </div>
      <div className="h-20 w-20 rounded-xl step-shimmer flex-none" />
    </div>
  </div>
);

// --- Add Custom Step Dialog ---
const AddStepDialog = ({ onClose, onSave }: { onClose: () => void; onSave: (s: Step) => void; }) => {
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [checking, setChecking] = useState(false);
  const [warning, setWarning] = useState<{ verdict: string; summary: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setChecking(true); setError(null); setWarning(null);
    try {
      const { data, error } = await supabase.functions.invoke("ingredient-analyzer", {
        body: { profile: loadProfile(), productOrIngredients: `Routine step: ${title}\nDescription: ${desc || "(none)"}` },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const a = data.analysis;
      if (a && (a.verdict === "UNSAFE" || a.verdict === "CAUTION")) {
        setWarning({ verdict: a.verdict, summary: a.summary });
        setChecking(false);
        return;
      }
      onSave({ step: title.trim(), product_type: "Custom", ingredient: desc.trim() || "—", why: a?.summary || "Custom step added by you.", isCustom: true });
    } catch (e: any) { setError(e.message || "Could not check this step."); }
    finally { setChecking(false); }
  };

  const confirmAnyway = () => {
    onSave({ step: title.trim(), product_type: "Custom", ingredient: desc.trim() || "—", why: warning?.summary || "Custom step added by you.", isCustom: true });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-[400px] bg-white rounded-t-3xl sm:rounded-3xl p-5 animate-[slideUp_0.25s_ease-out] sm:animate-scale-in" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-xl text-foreground">Add a routine step</h3>
          <button onClick={onClose} aria-label="Close" className="h-8 w-8 rounded-full bg-spa-mist flex items-center justify-center">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="block text-xs font-bold text-foreground/70 mb-1">Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Vitamin C Serum" className="w-full rounded-2xl bg-spa-mist px-4 py-3 text-sm text-foreground outline-none mb-3" />
        <label className="block text-xs font-bold text-foreground/70 mb-1">Description (optional)</label>
        <textarea value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What is this step / which ingredients?" rows={3} className="w-full rounded-2xl bg-spa-mist px-4 py-3 text-sm text-foreground outline-none mb-4 resize-none" />

        {error && <div className="mb-3 rounded-xl bg-destructive/10 p-2 text-xs text-destructive">{error}</div>}

        {warning && (
          <div className={`mb-3 rounded-2xl p-3 text-sm border ${warning.verdict === "UNSAFE" ? "bg-red-50 border-red-200 text-red-800" : "bg-yellow-50 border-yellow-200 text-yellow-900"}`}>
            <div className="flex items-center gap-2 font-bold mb-1">
              <AlertTriangle className="h-4 w-4" /> {warning.verdict === "UNSAFE" ? "Not recommended" : "Use with caution"}
            </div>
            <p className="text-xs">{warning.summary}</p>
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 rounded-2xl py-3 text-sm font-bold bg-spa-mist text-foreground">Cancel</button>
          {warning ? (
            <button onClick={confirmAnyway} className="flex-1 rounded-2xl py-3 text-sm font-bold text-white" style={{ background: LAVENDER_DEEP }}>Add anyway</button>
          ) : (
            <button onClick={handleSubmit} disabled={!title.trim() || checking} className="flex-1 rounded-2xl py-3 text-sm font-bold text-white disabled:opacity-60 inline-flex items-center justify-center gap-2" style={{ background: LAVENDER_DEEP }}>
              {checking ? <><Loader2 className="h-4 w-4 animate-spin" /> Checking…</> : "Add step"}
            </button>
          )}
        </div>
      </div>
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
  const [showAddStep, setShowAddStep] = useState(false);
  const [profileVersion, setProfileVersion] = useState(0);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const longPressTimer = useRef<number | null>(null);

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

  useEffect(() => {
    const handler = () => setProfileVersion((v) => v + 1);
    const routineHandler = () => {
      const cached = localStorage.getItem("dermo.routine.v1");
      if (cached) setRoutine(JSON.parse(cached));
    };
    window.addEventListener("focus", handler);
    window.addEventListener("dermo:profile-updated", handler);
    window.addEventListener("dermo:routine-updated", routineHandler);
    return () => {
      window.removeEventListener("focus", handler);
      window.removeEventListener("dermo:profile-updated", handler);
      window.removeEventListener("dermo:routine-updated", routineHandler);
    };
  }, []);

  const timesFor = (f: FocusKey): { key: TimeKey; label: string; Icon: any }[] => {
    if (f === "Skin") return [{ key: "morning", label: "Morning", Icon: Sun }, { key: "night", label: "Night", Icon: Moon }];
    if (f === "Hair") return [{ key: "weekly", label: "Weekly", Icon: Sparkles }];
    return [{ key: "daily", label: "Daily", Icon: Sparkles }];
  };

  const getCurrentSteps = (r: Routine | null): Step[] => {
    if (!r) return [];
    if (activeFocus === "Skin") return (activeTime === "night" ? r.skin?.night : r.skin?.morning) || [];
    if (activeFocus === "Hair") return r.hair?.weekly || [];
    return r.nails?.daily || [];
  };

  const setCurrentSteps = (steps: Step[]) => {
    const r: Routine = routine ? JSON.parse(JSON.stringify(routine)) : { skin: { morning: [], night: [] }, hair: { weekly: [] }, nails: { daily: [] } };
    if (activeFocus === "Skin") {
      r.skin = r.skin || {};
      if (activeTime === "night") r.skin.night = steps; else r.skin.morning = steps;
    } else if (activeFocus === "Hair") {
      r.hair = r.hair || {}; r.hair.weekly = steps;
    } else {
      r.nails = r.nails || {}; r.nails.daily = steps;
    }
    setRoutine(r);
    localStorage.setItem("dermo.routine.v1", JSON.stringify(r));
    window.dispatchEvent(new CustomEvent("dermo:routine-updated"));
  };

  const addCustomStep = (s: Step) => {
    setCurrentSteps([...getCurrentSteps(routine), s]);
    setShowAddStep(false);
  };

  const renameStep = (idx: number, newName: string) => {
    const steps = [...getCurrentSteps(routine)];
    const old = steps[idx];
    // Move selected product reference to new key as well
    const profileNow = loadProfile();
    const sel = { ...((profileNow?.selectedProducts || {}) as Record<string, any>) };
    const oldK = slotKey(activeFocus, activeTime, old.step);
    const newK = slotKey(activeFocus, activeTime, newName);
    if (sel[oldK]) { sel[newK] = sel[oldK]; delete sel[oldK]; localStorage.setItem("dermo.profile.v1", JSON.stringify({ ...profileNow, selectedProducts: sel })); window.dispatchEvent(new CustomEvent("dermo:profile-updated")); }
    steps[idx] = { ...old, step: newName };
    setCurrentSteps(steps);
  };

  // ---- Drag-to-reorder via long-press ----
  const startDrag = (idx: number) => {
    setDragIndex(idx);
    setHoverIndex(idx);
  };

  const onPointerDown = (idx: number) => (e: React.PointerEvent) => {
    if (longPressTimer.current) window.clearTimeout(longPressTimer.current);
    const startY = e.clientY;
    longPressTimer.current = window.setTimeout(() => {
      startDrag(idx);
      if (navigator.vibrate) try { navigator.vibrate(10); } catch {}
    }, 380);
    void startY;
  };

  useEffect(() => {
    if (dragIndex === null) return;
    const onMove = (e: PointerEvent) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const card = el?.closest<HTMLElement>("[data-step-idx]");
      if (card) {
        const i = Number(card.dataset.stepIdx);
        if (!Number.isNaN(i)) setHoverIndex(i);
      }
    };
    const onUp = () => {
      if (dragIndex !== null && hoverIndex !== null && dragIndex !== hoverIndex) {
        const steps = [...getCurrentSteps(routine)];
        const [moved] = steps.splice(dragIndex, 1);
        steps.splice(hoverIndex, 0, moved);
        setCurrentSteps(steps);
      }
      setDragIndex(null); setHoverIndex(null);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [dragIndex, hoverIndex, routine, activeFocus, activeTime]);

  const onPointerUpCancelLong = () => {
    if (longPressTimer.current) { window.clearTimeout(longPressTimer.current); longPressTimer.current = null; }
  };

  const times = timesFor(activeFocus);
  const currentTime = times.find((t) => t.key === activeTime) || times[0];
  const TimeIcon = currentTime?.Icon || Sun;
  const selectedProducts = (loadProfile()?.selectedProducts || {}) as Record<string, any>;
  void profileVersion;

  const steps = getCurrentSteps(routine);

  return (
    <div className="relative min-h-full bg-white">
      <div className="px-5 pt-7 pb-5 flex items-center gap-3 bg-white">
        <DermoLogo color={LAVENDER_DEEP} size={42} />
        <h1 className="font-heading text-[34px] text-foreground">Your Routine</h1>
      </div>

      <div className="px-4 pt-5 pb-10 space-y-4 rounded-t-[28px]" style={{ background: "linear-gradient(180deg, #aab5fb 0%, #aab5fb 100%)" }}>
        {/* Top row: caution (text, no icon) + add step (text, no icon) */}
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setShowCaution(true)}
            className="rounded-full bg-white shadow-soft px-5 py-2 text-sm font-bold text-foreground hover:bg-spa-mist"
          >
            Safety & Cautions
          </button>
          <button
            onClick={() => setShowAddStep(true)}
            className="rounded-full shadow-soft px-5 py-2 text-sm font-bold text-white hover:opacity-90"
            style={{ background: LAVENDER_DEEP }}
          >
            Add Step
          </button>
        </div>

        <div className="rounded-3xl bg-white px-5 py-4 shadow-soft">
          <div className="flex items-center gap-3">
            <p className="font-heading text-foreground text-2xl">{currentTime?.label} · {activeFocus}</p>
            <TimeIcon className="h-7 w-7" stroke={LAVENDER_DEEP} />
          </div>
          <div className="flex gap-5 mt-2">
            {(["Skin", "Hair", "Nails"] as FocusKey[]).map((f) => {
              const on = f === activeFocus;
              return (
                <button key={f} onClick={() => { setActiveFocus(f); setActiveTime(timesFor(f)[0].key); }}
                  className={`relative pb-1 text-sm ${on ? "font-bold text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {f}
                  {on && <span className="absolute -bottom-0.5 left-0 right-0 h-1 rounded-full" style={{ background: LAVENDER_DEEP }} />}
                </button>
              );
            })}
          </div>
          {times.length > 1 && (
            <div className="flex gap-3 mt-3">
              {times.map((t) => (
                <button key={t.key} onClick={() => setActiveTime(t.key)}
                  className={`text-xs font-semibold px-3 py-1 rounded-full transition-colors ${activeTime === t.key ? "bg-baby-blue text-foreground" : "bg-muted text-muted-foreground hover:bg-baby-blue/60"}`}>
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="space-y-3">
            <div className="flex flex-col items-center pt-2 pb-3 gap-2 text-foreground/80">
              <Sparkles className="h-6 w-6 animate-pulse-soft" />
              <p className="text-sm font-semibold animate-pulse-soft">Dermo is crafting your routine…</p>
            </div>
            {[0, 1, 2, 3].map((i) => <SkeletonStep key={i} i={i} />)}
          </div>
        )}

        {error && <div className="rounded-2xl bg-white p-4 text-sm text-destructive">{error}</div>}

        {routine?.warnings && routine.warnings.length > 0 && (
          <div className="rounded-2xl bg-white p-4 text-sm text-foreground/80">
            <ul className="space-y-1 list-disc pl-4">{routine.warnings.map((w, i) => <li key={i}>{w}</li>)}</ul>
          </div>
        )}

        {!loading && steps.map((s, i) => {
          const key = slotKey(activeFocus, activeTime, s.step);
          const isDragging = dragIndex === i;
          const isHover = dragIndex !== null && hoverIndex === i && dragIndex !== i;
          return (
            <div
              key={`${key}-${i}`}
              data-step-idx={i}
              style={{
                opacity: isDragging ? 0.5 : 1,
                transform: isHover ? `translateY(${dragIndex! < i ? -6 : 6}px)` : "none",
                transition: "transform 150ms ease, opacity 120ms ease",
              }}
              onPointerUp={onPointerUpCancelLong}
              onPointerLeave={onPointerUpCancelLong}
            >
              <StepCard
                s={s}
                n={i + 1}
                index={i}
                chosen={selectedProducts[key]}
                onFind={(q) => onFindProducts?.(q)}
                isReorder={true}
                onRename={(name) => renameStep(i, name)}
                dragHandlers={{ onPointerDown: onPointerDown(i) }}
              />
            </div>
          );
        })}

        <p className="text-[11px] text-center text-foreground/70 pt-2">
          Hold a step to drag and reorder. Dermo AI does not replace professional medical care.
        </p>
      </div>

      {showCaution && <CautionModal profile={profile} onClose={() => setShowCaution(false)} />}
      {showAddStep && <AddStepDialog onClose={() => setShowAddStep(false)} onSave={addCustomStep} />}
    </div>
  );
};
