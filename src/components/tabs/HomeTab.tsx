import { useEffect, useState } from "react";
import { loadProfile, allGoals, UserProfile } from "@/lib/profile";
import { Sparkles, Target, ShoppingBag, ScanLine, MessageCircle } from "lucide-react";
import bear from "@/assets/dermo-bear.svg";
import { Tab } from "@/pages/Home";

export const HomeTab = ({ onNavigate }: { onNavigate: (t: Tab) => void }) => {
  const [p, setP] = useState<UserProfile | null>(null);
  useEffect(() => { setP(loadProfile()); }, []);

  const name = p?.personalInfo?.firstName || "there";
  const goals = allGoals(p).slice(0, 4);

  const tiles: { id: Tab; label: string; Icon: any; tint: string }[] = [
    { id: "routine", label: "Today's Routine", Icon: Sparkles, tint: "bg-baby-blue" },
    { id: "scan", label: "Scan a Product", Icon: ScanLine, tint: "bg-spa-mist" },
    { id: "products", label: "Find Products", Icon: ShoppingBag, tint: "bg-baby-blue" },
    { id: "chat", label: "Ask Dermo", Icon: MessageCircle, tint: "bg-spa-mist" },
  ];

  return (
    <div className="px-5 pt-8 pb-6 space-y-6">
      <div className="flex items-center gap-3">
        <img src={bear} alt="Dermo" className="h-14 w-14 object-contain" />
        <div>
          <p className="text-xs text-muted-foreground">Welcome back</p>
          <h2 className="font-heading text-2xl text-navy leading-tight">Hi, {name} 👋</h2>
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-baby-blue to-spa-mist p-5 shadow-soft">
        <p className="text-xs font-semibold text-navy/70 uppercase tracking-wide">Your focus today</p>
        <p className="font-heading text-navy text-xl mt-1">
          {goals.length ? goals.join(" · ") : "Build a personalized routine"}
        </p>
        <button
          onClick={() => onNavigate("routine")}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-navy shadow-soft active:scale-95 transition"
        >
          Open routine →
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tiles.map(({ id, label, Icon, tint }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`rounded-2xl ${tint} p-4 text-left flex flex-col gap-3 min-h-[110px] active:scale-95 transition shadow-soft`}
          >
            <Icon className="h-6 w-6 text-navy" />
            <span className="font-heading text-navy text-sm leading-tight">{label}</span>
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-border p-4 flex items-start gap-3">
        <Target className="h-5 w-5 text-navy flex-none mt-0.5" />
        <div>
          <p className="font-heading text-navy text-sm">Track your progress</p>
          <p className="text-xs text-muted-foreground mt-0.5">Log how your skin, hair, or nails feel each week. Dermo learns and adapts.</p>
          <button onClick={() => onNavigate("goals")} className="mt-2 text-xs font-semibold text-navy underline">View goals</button>
        </div>
      </div>

      <p className="text-[11px] text-center text-muted-foreground">Dermo AI does not replace professional medical care.</p>
    </div>
  );
};
