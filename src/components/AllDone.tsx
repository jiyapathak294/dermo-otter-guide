import { useEffect, useState } from "react";
import { DermoLogo } from "@/components/DermoLogo";
import { loadProfile } from "@/lib/profile";

export const AllDone = ({ onNext }: { onNext: () => void }) => {
  const [leaving, setLeaving] = useState(false);
  const name = loadProfile()?.personalInfo?.firstName || "there";

  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), 2200);
    const t2 = setTimeout(onNext, 2700);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [onNext]);

  return (
    <div className={`app-frame bg-white flex flex-col items-center justify-center transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`}>
      <div className="animate-scale-in">
        <DermoLogo color="#8d77ab" size={120} />
      </div>
      <h1 className="font-heading text-[36px] mt-8 text-foreground animate-fade-in">
        All done, {name}!
      </h1>
      <p className="mt-4 px-10 text-center text-[14px] text-muted-foreground leading-relaxed animate-fade-in">
        Your personalized routine, products and learn page are ready.
      </p>
    </div>
  );
};

