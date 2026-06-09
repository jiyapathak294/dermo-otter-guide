import { useState } from "react";
import { LogOut } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { RoutineTab } from "@/components/tabs/RoutineTab";
import { ProductsTab } from "@/components/tabs/ProductsTab";
import { ScanTab } from "@/components/tabs/ScanTab";
import { ChatTab } from "@/components/tabs/ChatTab";
import { GoalsTab } from "@/components/tabs/GoalsTab";
import { LearnTab } from "@/components/tabs/LearnTab";
import { useAuth } from "@/lib/auth";

export type Tab = "routine" | "products" | "scan" | "chat" | "goals" | "learn";

export const Home = () => {
  const [tab, setTab] = useState<Tab>("routine");
  const [productQuery, setProductQuery] = useState<string>("");
  const { signOut } = useAuth();

  const goProducts = (q: string) => { setProductQuery(q); setTab("products"); };

  return (
    <div className="app-frame flex flex-col">
      <button
        onClick={signOut}
        aria-label="Sign out"
        className="absolute top-3 right-3 z-50 p-2 rounded-full bg-white/80 backdrop-blur border border-border text-muted-foreground hover:text-foreground hover:bg-white transition"
      >
        <LogOut className="w-4 h-4" />
      </button>
      <div className="flex-1 overflow-y-auto pb-24">
        {tab === "routine" && <RoutineTab onFindProducts={goProducts} />}
        {tab === "products" && <ProductsTab initialQuery={productQuery} />}
        {tab === "scan" && <ScanTab />}
        {tab === "chat" && <ChatTab />}
        {tab === "goals" && <GoalsTab />}
        {tab === "learn" && <LearnTab />}
      </div>
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
};

export default Home;
