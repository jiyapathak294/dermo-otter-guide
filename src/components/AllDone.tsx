import { useEffect, useState } from "react";
import { DermoLogo } from "@/components/DermoLogo";
import { loadProfile } from "@/lib/profile";
import otter from "@/assets/dermo-otter.png";

export const AllDone = ({ onNext }: { onNext: () => void }) => {
  const [leaving, setLeaving] = useState(false);
  const name = loadProfile()?.personalInfo?.firstName || "there";

  useEffect(() => {
    const t = setTimeout(() => setLeaving(true), 2800);
    const t2 = setTimeout(onNext, 3300);
    return () => { clearTimeout(t); clearTimeout(t2); };
  }, [onNext]);

  return (
    <div className={`app-frame bg-white flex flex-col items-center transition-opacity duration-500 ${leaving ? "opacity-0" : "opacity-100"}`}>
      <div className="mt-32 animate-fade-in">
        <DermoLogo color="#8d77ab" size={140} />
      </div>
      <h1 className="font-heading text-[40px] mt-10 text-foreground animate-fade-in">
        All Done, {name}!
      </h1>
      <p className="mt-6 px-10 text-center text-[15px] text-foreground/80 leading-relaxed animate-fade-in">
        Dermo is preparing your personalized plan. Your routine, products and learn pages will appear here next.
      </p>
      <img
        src={otter}
        alt="Dermo"
        className="absolute bottom-2 left-1/2 -translate-x-1/2 w-44 object-contain animate-otter-bob"
      />
    </div>
  );
};
