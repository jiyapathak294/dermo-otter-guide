import { useEffect, useState } from "react";
import { loadProfile, updateProfile, UserProfile, checkInGoal, uncheckGoalToday, goalStreak, goalPercent, checkedToday, allGoals } from "@/lib/profile";
import { Plus, X, Sparkles, Wind, Hand, Flame, Check } from "lucide-react";
import { DermoLogo } from "@/components/DermoLogo";

const SKIN = ["Clear acne", "Brighten skin", "Reduce redness", "Fade dark spots", "Improve hydration", "Smooth texture", "Reduce wrinkles", "Build a routine"];
const HAIR = ["Reduce hair loss", "Improve scalp health", "Reduce frizz", "Improve hair growth", "Reduce breakage", "Add shine"];
const NAIL = ["Strengthen nails", "Reduce peeling", "Improve growth", "Reduce discoloration", "Heal cuticles"];

const Group = ({ Icon, title, all, selected, onToggle }: any) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2"><Icon className="h-4 w-4 text-navy" /><p className="font-heading text-navy text-sm">{title}</p></div>
    <div className="flex flex-wrap gap-2">
      {selected.map((g: string) => (
        <button key={g} onClick={() => onToggle(g)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-navy text-white flex items-center gap-1 active:scale-95">
          {g} <X className="h-3 w-3" />
        </button>
      ))}
      {all.filter((g: string) => !selected.includes(g)).map((g: string) => (
        <button key={g} onClick={() => onToggle(g)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-baby-blue text-white flex items-center gap-1 active:scale-95">
          <Plus className="h-3 w-3" /> {g}
        </button>
      ))}
    </div>
  </div>
);

export const GoalsTab = () => {
  const [p, setP] = useState<UserProfile | null>(null);
  useEffect(() => { setP(loadProfile()); }, []);

  const toggle = (key: "skinGoals" | "hairGoals" | "nailGoals", g: string) => {
    const cur = (p?.[key] as string[]) || [];
    const next = cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g];
    const updated = updateProfile({ [key]: next });
    setP(updated);
  };

  const tracked = allGoals(p);

  const handleCheck = (g: string) => {
    const updated = checkedToday(g, p) ? uncheckGoalToday(g) : checkInGoal(g);
    setP(updated);
  };

  return (
    <div className="pb-6">
      <div className="px-5 pt-7 pb-4 flex items-center gap-3 bg-white">
        <DermoLogo color="hsl(var(--jazz-blue))" size={42} />
        <h1 className="font-heading text-[34px] text-foreground">Goals</h1>
      </div>
      <div className="px-5 space-y-5">
      <p className="text-sm text-muted-foreground">Goals personalize your routine, products, and Dermo's advice.</p>

      {tracked.length > 0 && (
        <section className="space-y-2">
          <div className="flex items-center gap-2"><Flame className="h-4 w-4 text-jazz-blue" /><p className="font-heading text-navy text-sm">Daily progress</p></div>
          <div className="space-y-2">
            {tracked.map((g) => {
              const done = checkedToday(g, p);
              const streak = goalStreak(g, p);
              const pct = goalPercent(g, p, 7);
              return (
                <div key={g} className="rounded-2xl bg-white border border-border p-3 shadow-soft">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleCheck(g)}
                      aria-label={done ? "Uncheck" : "Check"}
                      className={`h-8 w-8 rounded-full border-2 flex items-center justify-center flex-none transition-all ${done ? "bg-navy border-navy" : "border-navy bg-white"}`}
                    >
                      {done && <Check className="h-4 w-4 text-white" strokeWidth={3} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-navy font-heading truncate">{g}</p>
                      <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Flame className="h-3 w-3 text-jazz-blue" /> {streak} day{streak === 1 ? "" : "s"}</span>
                        <span>· {pct}% this week</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-spa-mist overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, background: "var(--gradient-progress)" }} />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <Group Icon={Sparkles} title="Skin goals" all={SKIN} selected={p?.skinGoals || []} onToggle={(g: string) => toggle("skinGoals", g)} />
      <Group Icon={Wind} title="Hair goals" all={HAIR} selected={p?.hairGoals || []} onToggle={(g: string) => toggle("hairGoals", g)} />
      <Group Icon={Hand} title="Nail goals" all={NAIL} selected={p?.nailGoals || []} onToggle={(g: string) => toggle("nailGoals", g)} />
      </div>
    </div>
  );
};
