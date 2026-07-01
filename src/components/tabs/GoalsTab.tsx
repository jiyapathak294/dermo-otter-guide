import { useEffect, useState } from "react";
import {
  loadProfile, updateProfile, UserProfile, checkInGoal, uncheckGoalToday,
  goalStreak, goalPercent, checkedToday, allGoals, removeGoal,
  recordWeeklyVisit, weeklyStreak, lastWeeksVisited,
} from "@/lib/profile";
import { Plus, X, Flame, Check, CalendarDays } from "lucide-react";
import { DermoLogo } from "@/components/DermoLogo";

const NAVY = "#1d2b5f";
const NAVY_LIGHT = "#3b54a5";

const dayLabel = (weekKey: string) => weekKey.slice(-3); // "Wxx"

export const GoalsTab = () => {
  const [p, setP] = useState<UserProfile | null>(null);
  const [newGoal, setNewGoal] = useState("");

  useEffect(() => {
    // record the visit for the current ISO week
    const updated = recordWeeklyVisit();
    setP(updated ?? loadProfile());
  }, []);

  const addCustom = () => {
    const v = newGoal.trim(); if (!v) return;
    const cur = (p?.skinGoals as string[]) || [];
    if (cur.includes(v)) { setNewGoal(""); return; }
    setP(updateProfile({ skinGoals: [...cur, v] }));
    setNewGoal("");
  };

  const tracked = allGoals(p);
  const streak = weeklyStreak(p);
  const weeks = lastWeeksVisited(8, p);

  const handleCheck = (g: string) => {
    setP(checkedToday(g, p) ? uncheckGoalToday(g) : checkInGoal(g));
  };

  const handleDelete = (g: string) => {
    setP(removeGoal(g));
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
        {/* Weekly streak card */}
        <div className="rounded-[24px] bg-white p-5 shadow-soft">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-full flex items-center justify-center text-white" style={{ background: NAVY }}>
              <Flame className="h-5 w-5" />
            </div>
            <div className="flex-1">
              <p className="font-heading text-foreground text-xl leading-tight">
                {streak} week{streak === 1 ? "" : "s"} in a row
              </p>
              <p className="text-[11px] text-muted-foreground mt-0.5 flex items-center gap-1">
                <CalendarDays className="h-3 w-3" /> Open Dermo each week to keep the streak going
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-8 gap-1.5">
            {weeks.map((w, i) => (
              <div key={w.key} className="flex flex-col items-center gap-1">
                <div
                  className="h-9 w-full rounded-lg transition-colors"
                  style={{ background: w.visited ? NAVY : "hsl(var(--muted))" }}
                  title={w.key}
                />
                <span className="text-[9px] text-muted-foreground tabular-nums">{i === weeks.length - 1 ? "Now" : dayLabel(w.key)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Add goal bar */}
        <div className="flex items-center gap-2 rounded-full bg-white pl-5 pr-2 py-2 shadow-soft">
          <input
            value={newGoal}
            onChange={(e) => setNewGoal(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustom()}
            placeholder="Add a new goal"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button onClick={addCustom} className="h-10 w-10 rounded-full flex items-center justify-center text-white" style={{ background: NAVY }} aria-label="Add goal">
            <Plus className="h-5 w-5" strokeWidth={2.6} />
          </button>
        </div>

        {/* Active goals card */}
        <div className="rounded-[26px] bg-white p-5 shadow-soft min-h-[40vh] space-y-4">
          <h2 className="font-heading text-2xl text-foreground">Active Goals</h2>

          {tracked.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No active goals yet. Add one above to start tracking your progress.
            </p>
          ) : (
            <div className="space-y-1">
              {tracked.map((g) => {
                const done = checkedToday(g, p);
                const s = goalStreak(g, p);
                const pct = goalPercent(g, p, 7);
                return (
                  <div key={g} className="flex items-center gap-3 py-2 group">
                    <button
                      onClick={() => handleCheck(g)}
                      aria-label={done ? "Uncheck" : "Check"}
                      className={`h-6 w-6 rounded-full border-2 flex items-center justify-center flex-none transition-all ${done ? "bg-foreground border-foreground" : "border-foreground/40 bg-white"}`}
                    >
                      {done && <Check className="h-3.5 w-3.5 text-white" strokeWidth={3} />}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm text-foreground truncate ${done ? "line-through text-muted-foreground" : ""}`}>{g}</p>
                      <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1"><Flame className="h-3 w-3" style={{ color: NAVY }} /> {s} day{s === 1 ? "" : "s"}</span>
                        <span>· {pct}% this week</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(g)}
                      aria-label={`Delete ${g}`}
                      className="h-8 w-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
