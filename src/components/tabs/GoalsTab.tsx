import { useEffect, useState } from "react";
import { loadProfile, updateGoals } from "@/lib/profile";
import { Target, Plus, X } from "lucide-react";

const SUGGESTED = [
  "Clear acne", "Improve hydration", "Reduce redness", "Strengthen hair",
  "Improve scalp health", "Reduce hair loss", "Grow healthier nails",
  "Reduce discoloration", "Build a routine", "Learn about ingredients"
];

export const GoalsTab = () => {
  const [goals, setGoals] = useState<string[]>([]);

  useEffect(() => { setGoals(loadProfile()?.goals || []); }, []);

  const toggle = (g: string) => {
    const next = goals.includes(g) ? goals.filter((x) => x !== g) : [...goals, g];
    setGoals(next); updateGoals(next);
  };

  return (
    <div className="px-5 pt-6 pb-6 space-y-4">
      <div className="flex items-center gap-2"><Target className="h-6 w-6 text-navy" /><h2 className="font-heading text-2xl text-navy">Your Goals</h2></div>
      <p className="text-sm text-muted-foreground">Goals personalize your routine, products, and chat advice.</p>

      <div className="space-y-2">
        <p className="font-heading text-navy text-sm">Active goals</p>
        {goals.length === 0 && <p className="text-sm text-muted-foreground">No goals yet. Add some below.</p>}
        <div className="flex flex-wrap gap-2">
          {goals.map((g) => (
            <button key={g} onClick={() => toggle(g)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-navy text-white flex items-center gap-1">
              {g} <X className="h-3 w-3" />
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2 pt-3">
        <p className="font-heading text-navy text-sm">Suggested</p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTED.filter((g) => !goals.includes(g)).map((g) => (
            <button key={g} onClick={() => toggle(g)} className="text-xs font-semibold px-3 py-1.5 rounded-full bg-baby-blue text-navy flex items-center gap-1">
              <Plus className="h-3 w-3" /> {g}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
