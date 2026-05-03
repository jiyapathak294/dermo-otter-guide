import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import otter from "@/assets/derma-otter.png";

const lines = [
  "Hi! I'm Derma 🦦",
  "Your friendly AI sidekick inside Dermo AI.",
  "My job? To help you help yourself — guiding you through skin, hair & nail care, one step at a time.",
  "Ready? Let's get to know you.",
];

export const DermaIntro = ({ onNext }: { onNext: () => void }) => {
  const [step, setStep] = useState(0);
  const [appeared, setAppeared] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAppeared(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (!appeared) return;
    if (step >= lines.length - 1) return;
    const t = setTimeout(() => setStep((s) => s + 1), 2200);
    return () => clearTimeout(t);
  }, [appeared, step]);

  return (
    <div className="app-frame flex flex-col items-center justify-between py-10 px-6 overflow-hidden">
      {/* Glow rings behind otter */}
      <div className="relative flex-1 w-full flex items-center justify-center">
        <div
          className={`absolute h-72 w-72 rounded-full bg-baby-blue/40 blur-2xl transition-all duration-1000 ${
            appeared ? "scale-100 opacity-100" : "scale-50 opacity-0"
          }`}
        />
        <div
          className={`absolute h-56 w-56 rounded-full bg-baby-blue-deep/20 transition-all duration-1000 delay-200 ${
            appeared ? "scale-100 opacity-100 animate-pulse-soft" : "scale-50 opacity-0"
          }`}
        />
        {/* Floating sparkles */}
        {appeared && (
          <>
            <span className="absolute top-6 left-10 text-2xl animate-pulse-soft">✨</span>
            <span className="absolute top-16 right-8 text-xl animate-pulse-soft" style={{ animationDelay: "0.4s" }}>✨</span>
            <span className="absolute bottom-10 left-6 text-lg animate-pulse-soft" style={{ animationDelay: "0.8s" }}>💧</span>
          </>
        )}
        <img
          src={otter}
          alt="Derma the otter"
          className={`relative z-10 w-64 h-64 object-contain transition-all duration-700 ${
            appeared
              ? "opacity-100 translate-y-0 scale-100 animate-otter-bob"
              : "opacity-0 translate-y-8 scale-75"
          }`}
        />
      </div>

      {/* Speech bubble */}
      <div className="w-full">
        <div
          key={step}
          className="relative bg-white border-2 border-baby-blue rounded-3xl px-5 py-5 shadow-soft animate-fade-in"
        >
          <div className="absolute -top-2 left-12 h-4 w-4 bg-white border-l-2 border-t-2 border-baby-blue rotate-45" />
          <p className="text-base text-foreground leading-snug min-h-[72px]">{lines[step]}</p>
          <div className="mt-3 flex items-center justify-between">
            <div className="flex gap-1.5">
              {lines.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === step ? "w-6 bg-navy" : "w-1.5 bg-border"
                  }`}
                />
              ))}
            </div>
            {step < lines.length - 1 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="text-xs font-heading text-navy/60 px-3 py-1 active:scale-95"
              >
                Skip ›
              </button>
            ) : (
              <button
                onClick={onNext}
                className="inline-flex items-center gap-1.5 rounded-full bg-white border-2 border-baby-blue text-navy font-heading text-sm px-5 py-2 active:bg-baby-blue active:scale-95 transition-all"
              >
                Let's go
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
