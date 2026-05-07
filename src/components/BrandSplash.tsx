import { useEffect, useState } from "react";
import { DermoLogo } from "@/components/DermoLogo";

export const BrandSplash = ({ onNext }: { onNext: () => void }) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), 1600);
    const t2 = setTimeout(onNext, 2100);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [onNext]);

  return (
    <div className="app-frame bg-white flex items-center justify-center">
      <div className={`transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100 animate-fade-in"}`}>
        <DermoLogo color="#8d77ab" size={130} />
      </div>
    </div>
  );
};
