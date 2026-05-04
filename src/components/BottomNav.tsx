import { Sparkles, ShoppingBag, ScanLine, MessageCircle, Target, BookOpen } from "lucide-react";
import { Tab } from "@/pages/Home";

const tabs: { id: Tab; label: string; Icon: any }[] = [
  { id: "routine", label: "Routine", Icon: Sparkles },
  { id: "products", label: "Products", Icon: ShoppingBag },
  { id: "scan", label: "Scan", Icon: ScanLine },
  { id: "chat", label: "Derma", Icon: MessageCircle },
  { id: "goals", label: "Goals", Icon: Target },
  { id: "learn", label: "Learn", Icon: BookOpen },
];

export const BottomNav = ({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) => (
  <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-2 py-2 grid grid-cols-6 gap-1">
    {tabs.map(({ id, label, Icon }) => {
      const on = active === id;
      return (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={`flex flex-col items-center gap-0.5 py-1.5 rounded-xl transition-colors ${
            on ? "text-navy" : "text-muted-foreground"
          }`}
        >
          <Icon className={`h-5 w-5 ${on ? "stroke-[2.5]" : ""}`} />
          <span className="text-[10px] font-semibold">{label}</span>
        </button>
      );
    })}
  </nav>
);
