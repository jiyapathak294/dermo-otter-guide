import { useEffect, useState } from "react";
import bear from "@/assets/dermo-bear.svg";

export const BrandSplash = ({ onNext }: { onNext: () => void }) => {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), 2200);
    const t2 = setTimeout(onNext, 2800);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [onNext]);

  return (
    <div className="app-frame bg-white flex flex-col items-center justify-center">
      <div className={`flex flex-col items-center gap-5 transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100 animate-fade-in"}`}>
        <img src={bear} alt="Dermo" className="h-32 w-32 object-contain animate-otter-bob" />
        <h1 className="font-heading text-4xl text-navy tracking-tight">Dermo AI</h1>
        <p className="text-sm text-muted-foreground">Your personal AI dermatology companion</p>
      </div>
      <div className={`absolute inset-0 bg-white pointer-events-none transition-opacity duration-500 ${leaving ? "opacity-100" : "opacity-0"}`} />
    </div>
  );
};
