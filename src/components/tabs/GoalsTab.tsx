import { useEffect, useState } from "react";
import {
  loadProfile, updateProfile, UserProfile, checkInGoal, uncheckGoalToday,
  goalStreak, goalPercent, checkedToday, allGoals,
} from "@/lib/profile";
import { Plus, X, Sparkles, Wind, Hand, Flame, Check } from "lucide-react";
import { DermoLogo } from "@/components/DermoLogo";

const SKIN = ["Clear acne", "Brighten skin", "Reduce redness", "Fade dark spots", "Improve hydration", "Smooth texture", "Reduce wrinkles", "Build a routine"];
const HAIR = ["Reduce hair loss", "Improve scalp health", "Reduce frizz", "Improve hair growth", "Reduce breakage", "Add shine"];
const NAIL = ["Strengthen nails", "Reduce peeling", "Improve growth", "Reduce discoloration", "Heal cuticles"];

const NAVY = "#1d2b5f";
const NAVY_LIGHT = "#3b54a5";

const Group = ({ Icon, title, all, selected, onToggle }: any) => (
  <div className="space-y-2">
    <div className="flex items-center gap-2"><Icon className="h-4 w-4" style={{ color: NAVY }} /><p className="font-heading text-sm" style={{ color: NAVY }}>{title}</p></div>
    <div className="flex flex-wrap gap-2">
      {selected.map((g: string) => (
        <button key={g} onClick={() => onToggle(g)} className="text-xs font-bold px-3 py-1.5 rounded-full text-white flex items-center gap-1 active:scale-95" style={{ background: NAVY }}>
          {g} <X className="h-3 w-3" />
        </button>
      ))}
      {all.filter((g: string) => !selected.includes(g)).map((g: string) => (
        <button key={g} onClick={() => onToggle(g)} className="text-xs font-bold px-3 py-1.5 rounded-full text-white flex items-center gap-1 active:scale-95" style={{ background: NAVY_LIGHT }}>
          <Plus className="h-3 w-3" /> {g}
        </button>
      ))}
    </div>
  </div>
);

export const GoalsTab = () => {
  const [p, setP] = useState<UserProfile | null>(null);
  const [newGoal, setNewGoal] = useState("");
  useEffect(() => { setP(loadProfile()); }, []);

  const toggle = (key: "skinGoals" | "hairGoals" | "nailGoals", g: string) => {
    const cur = (p?.[key] as string[]) || [];
    const next = cur.includes(g) ? cur.filter((x) => x !== g) : [...cur, g];
    setP(updateProfile({ [key]: next }));
  };

  const addCustom = () => {
    const v = newGoal.trim(); if (!v) return;
    const cur = (p?.skinGoals as string[]) || [];
    setP(updateProfile({ skinGoals: [...cur, v] }));
    setNewGoal("");
  };

  const tracked = allGoals(p);

  const handleCheck = (g: string) => {
    setP(checkedToday(g, p) ? uncheckGoalToday(g) : checkInGoal(g));
  };

  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="px-5 pt-7 pb-4 flex items-center gap-3 bg-white">
        <DermoLogo color={NAVY} size={42} />
        <h1 className="font-heading text-[34px] text-foreground">Goals</h1>
      </div>

      <div
        className="flex-1 px-4 pt-5 pb-10 space-y-4 rounded-t-[28px]"
        style={{ background: `linear-gradient(180deg, ${NAVY_LIGHT} 0%, ${NAVY} 100%)` }}
      >
        {/* Add goal bar */}
        <div className="flex items-center gap-2 rounded-full bg-white pl-5 pr-2 py-2 shadow-soft">
          <input
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="Add more goals"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button onClick={addCustom} className="h-10 w-10 rounded-full flex items-center justify-center text-white" style={{ background: NAVY }} aria-label="Add goal">
            <Plus className="h-5 w-5" strokeWidth={2.6} />
          </button>
        </div>

        {/* White card */}
        <div className="rounded-[26px] bg-white p-5 shadow-soft min-h-[60vh] space-y-5">
          <h2 className="font-heading text-2xl text-foreground">Active Goals</h2>

          {tracked.length === 0 ? (
            <p className="text-sm text-muted-foreground">No active goals yet. Pick one below to start tracking your streak.</p>
          ) : (
            <div className="space-y-2">
              {tracked.map((g) => {
                const done = checkedToday(g, p);
                const streak = goalStreak(g, p);
                const pct = goalPercent(g, p, 7);
                return (
                  <div key={g} className="flex items-center gap-3 py-1.5">
                    <button
                      onClick={() => handleCheck(g)}
                      aria-label={done ? "Uncheck" : "Check"}
                      className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-none transition-all ${done ? "bg-foreground border-foreground" : "border-foreground/40 bg-white"}`}
                    >
                      {done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">{g}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Flame className="h-3 w-3" style={{ color: NAVY }} /> {streak} day{streak === 1 ? "" : "s"}</span>
                        <span>· {pct}% this week</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-border pt-4 space-y-5">
            <Group Icon={Sparkles} title="Skin goals" all={SKIN} selected={p?.skinGoals || []} onToggle={(g: string) => toggle("skinGoals", g)} />
            <Group Icon={Wind} title="Hair goals" all={HAIR} selected={p?.hairGoals || []} onToggle={(g: string) => toggle("hairGoals", g)} />
            <Group Icon={Hand} title="Nail goals" all={NAIL} selected={p?.nailGoals || []} onToggle={(g: string) => toggle("nailGoals", g)} />
          </div>
        </div>
      </div>
    </div>
  );
};
