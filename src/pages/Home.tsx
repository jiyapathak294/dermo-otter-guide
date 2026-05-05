import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { HomeTab } from "@/components/tabs/HomeTab";
import { RoutineTab } from "@/components/tabs/RoutineTab";
import { ProductsTab } from "@/components/tabs/ProductsTab";
import { ScanTab } from "@/components/tabs/ScanTab";
import { ChatTab } from "@/components/tabs/ChatTab";
import { GoalsTab } from "@/components/tabs/GoalsTab";
import { LearnTab } from "@/components/tabs/LearnTab";

export type Tab = "home" | "routine" | "products" | "scan" | "chat" | "goals" | "learn";

export const Home = () => {
  const [tab, setTab] = useState<Tab>("home");
  const [productQuery, setProductQuery] = useState<string>("");

  const goProducts = (q: string) => { setProductQuery(q); setTab("products"); };

  return (
    <div className="app-frame flex flex-col">
      <div className="flex-1 overflow-y-auto pb-20">
        {tab === "home" && <HomeTab onNavigate={setTab} />}
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
