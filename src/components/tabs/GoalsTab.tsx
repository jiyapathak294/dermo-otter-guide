import { useEffect, useState } from "react";
import { loadProfile, updateProfile, UserProfile } from "@/lib/profile";
import { Target, Plus, X, Sparkles, Wind, Hand } from "lucide-react";

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

  return (
    <div className="px-5 pt-6 pb-6 space-y-5">
      <div className="flex items-center gap-2"><Target className="h-6 w-6 text-navy" /><h2 className="font-heading text-2xl text-navy">Your Goals</h2></div>
      <p className="text-sm text-muted-foreground">Goals personalize your routine, products, and Dermo's advice.</p>

      <Group Icon={Sparkles} title="Skin goals" all={SKIN} selected={p?.skinGoals || []} onToggle={(g: string) => toggle("skinGoals", g)} />
      <Group Icon={Wind} title="Hair goals" all={HAIR} selected={p?.hairGoals || []} onToggle={(g: string) => toggle("hairGoals", g)} />
      <Group Icon={Hand} title="Nail goals" all={NAIL} selected={p?.nailGoals || []} onToggle={(g: string) => toggle("nailGoals", g)} />
    </div>
  );
};
