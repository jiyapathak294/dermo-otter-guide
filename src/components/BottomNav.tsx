import { Home as HomeIcon, Sparkles, ShoppingBag, ScanLine, MessageCircle, Target, BookOpen } from "lucide-react";
import { Tab } from "@/pages/Home";

const tabs: { id: Tab; label: string; Icon: any }[] = [
  { id: "home", label: "Home", Icon: HomeIcon },
  { id: "routine", label: "Routine", Icon: Sparkles },
  { id: "products", label: "Products", Icon: ShoppingBag },
  { id: "scan", label: "Scan", Icon: ScanLine },
  { id: "chat", label: "Dermo", Icon: MessageCircle },
  { id: "goals", label: "Goals", Icon: Target },
  { id: "learn", label: "Learn", Icon: BookOpen },
];

export const BottomNav = ({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) => (
  <nav className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-border px-1 py-1.5 grid grid-cols-7 gap-0.5 z-50">
    {tabs.map(({ id, label, Icon }) => {
      const on = active === id;
      return (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="relative flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-all"
        >
          <div className={`flex items-center justify-center h-8 w-8 rounded-full transition-all ${on ? "bg-baby-blue scale-110" : ""}`}>
            <Icon className={`h-[18px] w-[18px] ${on ? "text-navy" : "text-muted-foreground"}`} strokeWidth={on ? 2.5 : 2} />
          </div>
          <span className={`text-[9px] font-semibold ${on ? "text-navy" : "text-muted-foreground"}`}>{label}</span>
        </button>
      );
    })}
  </nav>
);
