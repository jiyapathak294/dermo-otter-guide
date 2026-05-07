import { Sparkles, ShoppingBag, Target, BookOpen, MessageCircle } from "lucide-react";
import { Tab } from "@/pages/Home";

// Custom scan icon — corner bracket frame matching the UX
const ScanIcon = ({ className = "" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className} strokeWidth={2} stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 8V6a2 2 0 0 1 2-2h2" />
    <path d="M16 4h2a2 2 0 0 1 2 2v2" />
    <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
    <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
  </svg>
);

const tabs: { id: Tab; label: string; Icon: any }[] = [
  { id: "routine", label: "Routine", Icon: Sparkles },
  { id: "products", label: "Products", Icon: ShoppingBag },
  { id: "scan", label: "Scan", Icon: ScanIcon },
  { id: "chat", label: "Derma", Icon: MessageCircle },
  { id: "goals", label: "Goals", Icon: Target },
  { id: "learn", label: "Learn", Icon: BookOpen },
];

export const BottomNav = ({ active, onChange }: { active: Tab; onChange: (t: Tab) => void }) => (
  <nav className="absolute bottom-0 left-0 right-0 bg-white border-t border-border px-1 pt-2 pb-2 grid grid-cols-6 z-50">
    {tabs.map(({ id, label, Icon }) => {
      const on = active === id;
      return (
        <button
          key={id}
          onClick={() => onChange(id)}
          className="flex flex-col items-center gap-1 py-1"
        >
          <Icon className={`h-6 w-6 ${on ? "text-jazz-blue" : "text-muted-foreground"}`} strokeWidth={on ? 2.4 : 1.8} />
          <span className={`text-[11px] font-semibold ${on ? "text-jazz-blue" : "text-muted-foreground"}`}>{label}</span>
        </button>
      );
    })}
  </nav>
);
